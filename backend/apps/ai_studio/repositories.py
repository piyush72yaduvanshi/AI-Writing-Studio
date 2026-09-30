from typing import Optional
from django.db.models import QuerySet
from .models import AIRequest, AIRequestStatus

class AIRequestRepository:
    """Repository for managing AI execution audit logs."""

    @staticmethod
    def log_request(
        user,
        action: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        duration_ms: int,
        status: AIRequestStatus,
        document=None,
        error_message: Optional[str] = None
    ) -> AIRequest:
        return AIRequest.objects.create(
            user=user,
            document=document,
            action=action,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            duration_ms=duration_ms,
            status=status,
            error_message=error_message
        )

    @staticmethod
    def get_user_history(user, limit: int = 50) -> QuerySet[AIRequest]:
        return AIRequest.objects.filter(user=user).select_related('document').order_by('-created_at')[:limit]
