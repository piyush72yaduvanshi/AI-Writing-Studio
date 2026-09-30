from typing import Optional
from .models import User

class UserRepository:
    """Repository handling all direct database operations for User model."""

    @staticmethod
    def get_by_id(user_id) -> Optional[User]:
        return User.objects.filter(id=user_id).first()

    @staticmethod
    def get_by_email(email: str) -> Optional[User]:
        return User.objects.filter(email__iexact=email).first()

    @staticmethod
    def exists_by_email(email: str) -> bool:
        return User.objects.filter(email__iexact=email).exists()

    @staticmethod
    def create_user(email: str, password: str, username: str, **extra_fields) -> User:
        return User.objects.create_user(
            email=email,
            password=password,
            username=username,
            **extra_fields
        )

    @staticmethod
    def update_user(user: User, **fields) -> User:
        for key, value in fields.items():
            if hasattr(user, key):
                setattr(user, key, value)
        user.save()
        return user
