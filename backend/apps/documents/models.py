import uuid
from django.db import models
from django.conf import settings

class WritingMode(models.TextChoices):
    BLOG = 'blog', 'Blog'
    ARTICLE = 'article', 'Article'
    STORY = 'story', 'Story'
    MOVIE_WEB_SERIES = 'movie_web_series', 'Movie / Web Series'
    SCREENPLAY = 'screenplay', 'Screenplay Draft'
    CUSTOM = 'custom', 'Custom'

class WritingTone(models.TextChoices):
    SIMPLE = 'Simple', 'Simple'
    PROFESSIONAL = 'Professional', 'Professional'
    FRIENDLY = 'Friendly', 'Friendly'
    CREATIVE = 'Creative', 'Creative'
    FORMAL = 'Formal', 'Formal'
    CASUAL = 'Casual', 'Casual'
    CINEMATIC = 'Cinematic', 'Cinematic'
    EMOTIONAL = 'Emotional', 'Emotional'
    TECHNICAL = 'Technical', 'Technical'

class WritingLanguage(models.TextChoices):
    ENGLISH = 'English', 'English'
    HINDI = 'Hindi', 'Hindi'
    HINGLISH = 'Hinglish', 'Hinglish'

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255, default='Untitled Document')
    content = models.TextField(blank=True, default='')
    ai_result = models.TextField(blank=True, default='')
    mode = models.CharField(max_length=50, choices=WritingMode.choices, default=WritingMode.BLOG)
    language = models.CharField(max_length=50, choices=WritingLanguage.choices, default=WritingLanguage.ENGLISH)
    tone = models.CharField(max_length=50, choices=WritingTone.choices, default=WritingTone.SIMPLE)
    word_count = models.PositiveIntegerField(default=0)
    character_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['user', 'mode']),
            models.Index(fields=['user', 'language']),
        ]

    def save(self, *args, **kwargs):
        # Auto-compute word count and character count from content
        text = self.content.strip()
        self.character_count = len(text)
        self.word_count = len(text.split()) if text else 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.get_mode_display()})"

class DocumentVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, default='')
    ai_result = models.TextField(blank=True, default='')
    change_summary = models.CharField(max_length=255, default='Saved version')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-version_number']
        unique_together = ('document', 'version_number')
        indexes = [
            models.Index(fields=['document', '-version_number']),
        ]

    def __str__(self):
        return f"{self.document.title} - v{self.version_number}"
