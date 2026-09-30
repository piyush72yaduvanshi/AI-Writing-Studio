import hashlib
import json
import logging
from typing import Dict, Any, Optional, List
import redis
from django.conf import settings
from apps.common.exceptions import ApplicationError
from apps.documents.repositories import DocumentRepository, DocumentVersionRepository
from apps.references.services import ReferenceService
from prompts import (
    build_full_prompt, 
    get_action_directive, 
    get_mode_directive
)
from .models import AIRequestStatus
from .providers import get_ai_provider, get_default_ai_provider, AIResponse
from .repositories import AIRequestRepository

logger = logging.getLogger('apps.ai_studio')

class WritingService:
    """Core orchestration service for writing actions, prompts, RAG context, and AI execution."""

    @staticmethod
    def _get_cache_client():
        try:
            return redis.from_url(settings.REDIS_URL, socket_timeout=1.5)
        except Exception as exc:
            logger.warning(f"Could not connect to Redis cache: {exc}")
            return None

    @staticmethod
    def _compute_cache_key(
        content: str,
        action: str,
        mode: str,
        language: str,
        tone: str,
        custom_instruction: str,
        model: str,
        rag_context: List[str]
    ) -> str:
        payload = f"{content}|{action}|{mode}|{language}|{tone}|{custom_instruction}|{model}|{'#'.join(rag_context)}"
        digest = hashlib.sha256(payload.encode('utf-8')).hexdigest()
        return f"ai_cache:{digest}"

    @classmethod
    def execute_action(
        cls,
        user,
        action: str,
        content: str,
        document_id: Optional[str] = None,
        mode: str = 'blog',
        language: str = 'English',
        tone: str = 'Simple',
        custom_instruction: str = '',
        use_rag: bool = True,
        save_version: bool = False,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        # 1. Validation
        cleaned_content = content.strip()
        if not cleaned_content:
            raise ApplicationError(
                message="Cannot perform AI action on empty content.",
                code="EMPTY_CONTENT",
                status_code=400
            )

        if len(cleaned_content) > settings.AI_MAX_INPUT_LENGTH:
            raise ApplicationError(
                message=f"Content exceeds maximum allowed length of {settings.AI_MAX_INPUT_LENGTH} characters.",
                code="CONTENT_TOO_LONG",
                status_code=400,
                details={'current_length': len(cleaned_content), 'max_length': settings.AI_MAX_INPUT_LENGTH}
            )

        # 2. Associated document (if any)
        document = None
        if document_id:
            document = DocumentRepository.get_by_id(user, document_id)

        # 3. Retrieve RAG Context (Untrusted knowledge guidelines / formatting examples)
        retrieved_context = []
        if use_rag:
            retrieved_context = ReferenceService.retrieve_relevant_context(
                query=f"{action} {mode} {cleaned_content[:800]}",
                user_id=str(user.id),
                top_k=settings.AI_TOP_K,
                threshold=settings.AI_SIMILARITY_THRESHOLD
            )

        # 4. Check Redis Cache
        if provider or model or api_key:
            ai_provider = get_ai_provider(
                provider_name=provider,
                model=model,
                api_key=api_key
            )
        else:
            ai_provider = get_default_ai_provider()
        model_name = getattr(ai_provider, 'model', settings.OLLAMA_MODEL) or 'default'
        
        cache_client = cls._get_cache_client()
        cache_key = cls._compute_cache_key(
            content=cleaned_content,
            action=action,
            mode=mode,
            language=language,
            tone=tone,
            custom_instruction=custom_instruction,
            model=model_name,
            rag_context=retrieved_context
        )

        if cache_client:
            try:
                cached_data = cache_client.get(cache_key)
                if cached_data:
                    result = json.loads(cached_data)
                    result['cached'] = True
                    # If document provided, update document's ai_result
                    if document:
                        DocumentRepository.update(document, ai_result=result['content'])
                    return result
            except Exception as exc:
                logger.warning(f"Error checking cache: {exc}")

        # 5. Build prompt
        action_directive = get_action_directive(action)
        # If action is convert_to_blog, convert_to_story, etc., or mode-specific
        if action in ('convert_to_blog', 'convert_to_story', 'convert_to_screenplay'):
            mode_directive = get_mode_directive(mode)
            action_directive = f"{action_directive}\n{mode_directive}"

        prompt = build_full_prompt(
            action_directive=action_directive,
            user_content=cleaned_content,
            mode=mode,
            language=language,
            tone=tone,
            retrieved_context=retrieved_context,
            custom_instruction=custom_instruction
        )

        # 6. Execute AI inference
        try:
            ai_res: AIResponse = ai_provider.generate(prompt=prompt)
            generated_text = ai_res.text
        except ApplicationError as app_err:
            AIRequestRepository.log_request(
                user=user,
                action=action,
                model=model_name,
                input_tokens=0,
                output_tokens=0,
                duration_ms=0,
                status=AIRequestStatus.FAILED,
                document=document,
                error_message=app_err.message
            )
            raise
        except Exception as exc:
            AIRequestRepository.log_request(
                user=user,
                action=action,
                model=model_name,
                input_tokens=0,
                output_tokens=0,
                duration_ms=0,
                status=AIRequestStatus.FAILED,
                document=document,
                error_message=str(exc)
            )
            raise ApplicationError(
                message=f"Inference error: {str(exc)}",
                code="INFERENCE_FAILED",
                status_code=502
            )

        # 7. Audit Logging
        AIRequestRepository.log_request(
            user=user,
            action=action,
            model=ai_res.model,
            input_tokens=ai_res.input_tokens,
            output_tokens=ai_res.output_tokens,
            duration_ms=ai_res.duration_ms,
            status=AIRequestStatus.SUCCESS,
            document=document
        )

        # 8. Update Document & Versions (if requested)
        if document:
            DocumentRepository.update(document, ai_result=generated_text)
            if save_version:
                DocumentVersionRepository.create_version(
                    document=document,
                    change_summary=f"AI Action: {action.replace('_', ' ').title()}"
                )

        response_data = {
            'content': generated_text,
            'action': action,
            'model': ai_res.model,
            'provider': getattr(ai_res, 'provider', 'ollama'),
            'duration_ms': ai_res.duration_ms,
            'input_tokens': ai_res.input_tokens,
            'output_tokens': ai_res.output_tokens,
            'cached': False,
            'document_id': str(document.id) if document else None
        }

        # 9. Store in cache
        if cache_client:
            try:
                cache_client.setex(
                    cache_key,
                    settings.AI_CACHE_TTL,
                    json.dumps(response_data)
                )
            except Exception as exc:
                logger.warning(f"Error saving to Redis cache: {exc}")

        return response_data
