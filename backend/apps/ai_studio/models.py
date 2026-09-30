import uuid
from django.db import models
from django.conf import settings

class AIRequestStatus(models.TextChoices):
    SUCCESS = 'SUCCESS', 'Success'
    FAILED = 'FAILED', 'Failed'

class AIRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_requests')
    document = models.ForeignKey(
        'documents.Document',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ai_requests'
    )
    action = models.CharField(max_length=100, db_index=True)
    model = models.CharField(max_length=100)
    input_tokens = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)
    duration_ms = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=AIRequestStatus.choices, default=AIRequestStatus.SUCCESS)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', 'status']),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} ({self.status}) at {self.created_at}"
