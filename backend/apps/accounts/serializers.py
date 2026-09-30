from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    """User profile serializer."""
    class Meta:
        model = User
        fields = [
            'id', 
            'email', 
            'username', 
            'first_name', 
            'last_name', 
            'preferred_language', 
            'preferred_tone', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class RegisterSerializer(serializers.Serializer):
    """Registration request payload serializer."""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, min_length=8)
    username = serializers.CharField(required=False, allow_blank=True, max_length=150)
    preferred_language = serializers.ChoiceField(
        choices=['English', 'Hindi', 'Hinglish'], 
        default='English', 
        required=False
    )
    preferred_tone = serializers.ChoiceField(
        choices=[
            'Simple', 'Professional', 'Friendly', 'Creative', 
            'Formal', 'Casual', 'Cinematic', 'Emotional', 'Technical'
        ],
        default='Simple',
        required=False
    )

class LoginSerializer(serializers.Serializer):
    """Login request payload serializer."""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class UpdateProfileSerializer(serializers.ModelSerializer):
    """Update profile serializer."""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'preferred_language', 'preferred_tone']

class RefreshTokenSerializer(serializers.Serializer):
    """Token refresh payload serializer."""
    refresh = serializers.CharField(required=True)

class LogoutSerializer(serializers.Serializer):
    """Token logout payload serializer."""
    refresh = serializers.CharField(required=True)
