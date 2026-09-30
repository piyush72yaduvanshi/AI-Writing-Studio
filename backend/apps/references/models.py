import uuid
from django.db import models
from django.conf import settings

class ReferenceStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PROCESSING = 'PROCESSING', 'Processing'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'

class ReferenceCategory(models.TextChoices):
    GUIDELINES = 'guidelines', 'Writing Guidelines'
    SCREENPLAY_RULES = 'screenplay_rules', 'Screenplay Structure'
    STORYTELLING = 'storytelling', 'Storytelling Principles'
    BLOG_STANDARDS = 'blog_standards', 'Blog Guidelines'
    FORMATTING = 'formatting', 'Formatting Examples'
    USER_CUSTOM = 'user_custom', 'User Provided Reference'

class WritingReference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='references'
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='references/%Y/%m/', blank=True, null=True)
    text_content = models.TextField(blank=True, default='')
    category = models.CharField(
        max_length=50,
        choices=ReferenceCategory.choices,
        default=ReferenceCategory.USER_CUSTOM
    )
    is_global = models.BooleanField(default=False, help_text="Global reference accessible to all users")
    status = models.CharField(
        max_length=20,
        choices=ReferenceStatus.choices,
        default=ReferenceStatus.PENDING,
        db_index=True
    )
    chunk_count = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_global', 'status']),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"

class ReferenceChunk(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.ForeignKey(WritingReference, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.PositiveIntegerField()
    text = models.TextField()
    qdrant_point_id = models.UUIDField(default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['chunk_index']
        unique_together = ('reference', 'chunk_index')
