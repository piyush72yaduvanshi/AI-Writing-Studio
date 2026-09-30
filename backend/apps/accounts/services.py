from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from apps.common.exceptions import ApplicationError
from .repositories import UserRepository
from .models import User
from typing import Dict, Any

class AuthService:
    """Service handling business logic for authentication and user accounts."""

    @staticmethod
    def register_user(validated_data: Dict[str, Any]) -> Dict[str, Any]:
        email = validated_data['email'].lower().strip()
        password = validated_data['password']
        username = validated_data.get('username') or email.split('@')[0]
        
        if UserRepository.exists_by_email(email):
            raise ApplicationError(
                message='A user with this email address already exists.',
                code='EMAIL_ALREADY_EXISTS',
                status_code=400
            )

        user = UserRepository.create_user(
            email=email,
            password=password,
            username=username,
            preferred_language=validated_data.get('preferred_language', 'English'),
            preferred_tone=validated_data.get('preferred_tone', 'Simple'),
        )

        refresh = RefreshToken.for_user(user)

        return {
            'user': user,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }

    @staticmethod
    def authenticate_user(email: str, password: str) -> Dict[str, Any]:
        email = email.lower().strip()
        user = UserRepository.get_by_email(email)
        
        if not user or not user.check_password(password):
            raise ApplicationError(
                message='Invalid email or password.',
                code='INVALID_CREDENTIALS',
                status_code=401
            )

        if not user.is_active:
            raise ApplicationError(
                message='Account is disabled.',
                code='ACCOUNT_DISABLED',
                status_code=403
            )

        refresh = RefreshToken.for_user(user)

        return {
            'user': user,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }

    @staticmethod
    def refresh_tokens(refresh_token_str: str) -> Dict[str, str]:
        try:
            refresh = RefreshToken(refresh_token_str)
            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        except Exception as exc:
            raise ApplicationError(
                message='Invalid or expired refresh token.',
                code='INVALID_REFRESH_TOKEN',
                status_code=401,
                details={'error': str(exc)}
            )

    @staticmethod
    def logout(refresh_token_str: str) -> None:
        try:
            token = RefreshToken(refresh_token_str)
            token.blacklist()
        except Exception:
            # Idempotent logout: even if token was already blacklisted or invalid, proceed
            pass
