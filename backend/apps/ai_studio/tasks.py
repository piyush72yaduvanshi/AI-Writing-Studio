import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from apps.common.exceptions import ApplicationError
from .services import WritingService

logger = logging.getLogger('apps.ai_studio')
User = get_user_model()

@shared_task(
    bind=True, 
    max_retries=3, 
    default_retry_delay=3,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=30,
    retry_jitter=True
)
def process_async_ai_action(
    self,
    user_id: str,
    action: str,
    content: str,
    document_id: str = None,
    mode: str = 'blog',
    language: str = 'English',
    tone: str = 'Simple',
    custom_instruction: str = '',
    use_rag: bool = True,
    save_version: bool = False,
    provider: str = None,
    model: str = None,
    api_key: str = None
):
    """
    Asynchronous Celery task for running long-form or batch AI writing transformations.
    Guarantees automatic retry with exponential backoff and jitter on transient network/provider failures.
    """
    logger.info(f"[Task {self.request.id}] Starting async AI action '{action}' for user {user_id}")
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"[Task {self.request.id}] User {user_id} not found.")
        return {'status': 'FAILED', 'error': f"User {user_id} does not exist."}

    try:
        result = WritingService.execute_action(
            user=user,
            action=action,
            content=content,
            document_id=document_id,
            mode=mode,
            language=language,
            tone=tone,
            custom_instruction=custom_instruction,
            use_rag=use_rag,
            save_version=save_version,
            provider=provider,
            model=model,
            api_key=api_key
        )
        logger.info(f"[Task {self.request.id}] Completed AI action '{action}' in {result.get('duration_ms', 0)}ms")
        return {
            'status': 'SUCCESS',
            'data': result
        }
    except ApplicationError as app_err:
        logger.warning(f"[Task {self.request.id}] Application error: {app_err.message}")
        # Don't retry non-retryable 400 errors like EMPTY_CONTENT
        if app_err.status_code < 500 and app_err.status_code != 429:
            return {'status': 'FAILED', 'error': app_err.message, 'code': app_err.code}
        raise self.retry(exc=app_err)
    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Unexpected error during AI action: {exc}")
        raise self.retry(exc=exc)
