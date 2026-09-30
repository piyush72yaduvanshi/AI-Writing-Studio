import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    """Custom user manager where email is the unique identifier for auth."""
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        username = extra_fields.get('username') or email.split('@')[0]
        extra_fields.setdefault('username', username)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    preferred_language = models.CharField(
        max_length=50,
        default='English',
        choices=[
            ('English', 'English'),
            ('Hindi', 'Hindi'),
            ('Hinglish', 'Hinglish'),
        ]
    )
    preferred_tone = models.CharField(
        max_length=50,
        default='Simple',
        choices=[
            ('Simple', 'Simple'),
            ('Professional', 'Professional'),
            ('Friendly', 'Friendly'),
            ('Creative', 'Creative'),
            ('Formal', 'Formal'),
            ('Casual', 'Casual'),
            ('Cinematic', 'Cinematic'),
            ('Emotional', 'Emotional'),
            ('Technical', 'Technical'),
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.email
