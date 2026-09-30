from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
from drf_spectacular.utils import extend_schema

from apps.common.responses import success_response
from .serializers import (
    AIOperationRequestSerializer,
    AIActionDispatcherSerializer,
    AIResponseDataSerializer,
    AIRequestLogSerializer,
)
from .services import WritingService
from .repositories import AIRequestRepository
from .providers import get_ai_provider, OllamaProvider, GeminiProvider, OpenRouterProvider, OpenAIProvider

class BaseAIActionView(APIView):
    """Base class for writing action endpoints."""
    permission_classes = [IsAuthenticated]
    action_name = 'improve'

    @extend_schema(request=AIOperationRequestSerializer, responses={200: AIResponseDataSerializer})
    def post(self, request):
        serializer = AIOperationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = WritingService.execute_action(
            user=request.user,
            action=self.action_name,
            content=data['content'],
            document_id=data.get('document_id'),
            mode=data.get('mode', 'blog'),
            language=data.get('language', 'English'),
            tone=data.get('tone', 'Simple'),
            custom_instruction=data.get('custom_instruction', ''),
            use_rag=data.get('use_rag', True),
            save_version=data.get('save_version', False),
            provider=data.get('provider'),
            model=data.get('model'),
            api_key=data.get('api_key'),
        )
        return success_response(data=result, message=f"Action '{self.action_name}' completed successfully.")

class ImproveWritingView(BaseAIActionView):
    action_name = 'improve'

class FixGrammarView(BaseAIActionView):
    action_name = 'fix_grammar'

class TranslateView(BaseAIActionView):
    action_name = 'translate'

class RewriteView(BaseAIActionView):
    action_name = 'rewrite'

class ExpandView(BaseAIActionView):
    action_name = 'expand'

class ShortenView(BaseAIActionView):
    action_name = 'shorten'

class StructureView(BaseAIActionView):
    action_name = 'generate_outline'

class ScreenplayView(BaseAIActionView):
    action_name = 'convert_to_screenplay'

class StoryView(BaseAIActionView):
    action_name = 'convert_to_story'

class AIActionDispatcherView(APIView):
    """Flexible dispatcher supporting any named writing action."""
    permission_classes = [IsAuthenticated]

    @extend_schema(request=AIActionDispatcherSerializer, responses={200: AIResponseDataSerializer})
    def post(self, request):
        serializer = AIActionDispatcherSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = WritingService.execute_action(
            user=request.user,
            action=data['action'],
            content=data['content'],
            document_id=data.get('document_id'),
            mode=data.get('mode', 'blog'),
            language=data.get('language', 'English'),
            tone=data.get('tone', 'Simple'),
            custom_instruction=data.get('custom_instruction', ''),
            use_rag=data.get('use_rag', True),
            save_version=data.get('save_version', False),
            provider=data.get('provider'),
            model=data.get('model'),
            api_key=data.get('api_key'),
        )
        return success_response(data=result, message=f"Action '{data['action']}' completed successfully.")

class AIRequestHistoryView(APIView):
    """Retrieve audit history of AI requests made by the current user."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: AIRequestLogSerializer(many=True)})
    def get(self, request):
        history = AIRequestRepository.get_user_history(request.user)
        return success_response(
            data=AIRequestLogSerializer(history, many=True).data,
            message="AI history retrieved successfully."
        )

class AIConfigStatusView(APIView):
    """Retrieve AI server configuration, active models, and readiness across Gemini, OpenRouter, OpenAI, and Ollama."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        gemini_ready = bool(getattr(settings, 'GEMINI_API_KEY', ''))
        openrouter_ready = bool(getattr(settings, 'OPENROUTER_API_KEY', ''))
        openai_ready = bool(getattr(settings, 'OPENAI_API_KEY', ''))
        ollama_models = OllamaProvider().list_models()
        is_ollama_model_present = (
            settings.OLLAMA_MODEL in ollama_models or 
            any(settings.OLLAMA_MODEL in m for m in ollama_models)
        )

        active_provider = getattr(settings, 'AI_PROVIDER', 'openrouter')
        is_ready = gemini_ready or openrouter_ready or openai_ready or is_ollama_model_present

        if active_provider == 'openrouter':
            configured_model = getattr(settings, 'OPENROUTER_MODEL', 'deepseek/deepseek-chat')
        elif active_provider == 'openai':
            configured_model = getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini')
        elif active_provider == 'gemini':
            configured_model = getattr(settings, 'GEMINI_MODEL', 'gemini-3.5-flash')
        else:
            configured_model = settings.OLLAMA_MODEL

        return success_response(
            data={
                'provider': active_provider,
                'providers': {
                    'gemini': {
                        'configured': gemini_ready,
                        'model': getattr(settings, 'GEMINI_MODEL', 'gemini-3.5-flash'),
                        'models': GeminiProvider().list_models(),
                    },
                    'openrouter': {
                        'configured': openrouter_ready,
                        'model': getattr(settings, 'OPENROUTER_MODEL', 'deepseek/deepseek-chat'),
                        'models': OpenRouterProvider().list_models(),
                    },
                    'openai': {
                        'configured': openai_ready,
                        'model': getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini'),
                        'models': OpenAIProvider().list_models(),
                    },
                    'ollama': {
                        'available': len(ollama_models) > 0,
                        'base_url': settings.OLLAMA_BASE_URL,
                        'configured_model': settings.OLLAMA_MODEL,
                        'embedding_model': settings.OLLAMA_EMBEDDING_MODEL,
                        'model_available': is_ollama_model_present,
                        'available_models': ollama_models,
                    },
                },
                'configured_model': configured_model,
                'embedding_model': 'text-embedding-004',
                'model_available': is_ready,
                'available_models': (
                    GeminiProvider().list_models() + 
                    OpenRouterProvider().list_models() + 
                    OpenAIProvider().list_models()
                ),
                'max_input_length': settings.AI_MAX_INPUT_LENGTH,
                'timeout_seconds': 90,
            },
            message="AI configuration loaded."
        )


class AsyncAIOperationView(APIView):
    """Queue an AI writing transformation asynchronously via Celery for zero-timeout resilience."""
    permission_classes = [IsAuthenticated]

    @extend_schema(request=AIActionDispatcherSerializer)
    def post(self, request):
        serializer = AIActionDispatcherSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        action = data.pop('action')
        content = data.pop('content')
        doc_id = str(data.get('document_id')) if data.get('document_id') else None

        from .tasks import process_async_ai_action
        task = process_async_ai_action.delay(
            user_id=str(request.user.id),
            action=action,
            content=content,
            document_id=doc_id,
            mode=data.get('mode', 'blog'),
            language=data.get('language', 'English'),
            tone=data.get('tone', 'Simple'),
            custom_instruction=data.get('custom_instruction', ''),
            use_rag=data.get('use_rag', True),
            save_version=data.get('save_version', False),
            provider=data.get('provider') or None,
            model=data.get('model') or None,
            api_key=data.get('api_key') or None,
        )

        return success_response(
            data={
                'task_id': task.id,
                'status': 'QUEUED',
                'action': action,
            },
            message="AI transformation task queued.",
            status_code=status.HTTP_202_ACCEPTED
        )


class AsyncAITaskStatusView(APIView):
    """Check execution status and retrieve result of an asynchronous AI Celery task."""
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        from celery.result import AsyncResult
        task_result = AsyncResult(task_id)

        if task_result.state == 'PENDING':
            response_data = {
                'task_id': task_id,
                'status': 'PENDING',
                'message': 'Task is waiting in queue...'
            }
        elif task_result.state in ('STARTED', 'PROGRESS'):
            response_data = {
                'task_id': task_id,
                'status': 'PROCESSING',
                'message': 'AI inference in progress...'
            }
        elif task_result.state == 'SUCCESS':
            result_payload = task_result.result
            if isinstance(result_payload, dict) and result_payload.get('status') == 'FAILED':
                response_data = {
                    'task_id': task_id,
                    'status': 'FAILED',
                    'error': result_payload.get('error', 'Task execution failed.')
                }
            else:
                data = result_payload.get('data') if isinstance(result_payload, dict) else result_payload
                response_data = {
                    'task_id': task_id,
                    'status': 'COMPLETED',
                    'data': data
                }
        elif task_result.state == 'FAILURE':
            response_data = {
                'task_id': task_id,
                'status': 'FAILED',
                'error': str(task_result.info)
            }
        else:
            response_data = {
                'task_id': task_id,
                'status': task_result.state
            }

        return success_response(data=response_data)

