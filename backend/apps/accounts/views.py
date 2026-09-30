from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema

from apps.common.responses import success_response
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UpdateProfileSerializer,
    RefreshTokenSerializer,
    LogoutSerializer,
)
from .services import AuthService
from .repositories import UserRepository

class RegisterView(APIView):
    """Register a new user account."""
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, responses={201: UserSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AuthService.register_user(serializer.validated_data)
        user_data = UserSerializer(result['user']).data
        return success_response(
            data={
                'user': user_data,
                'tokens': result['tokens']
            },
            message='Registration successful.',
            status_code=status.HTTP_201_CREATED
        )

class LoginView(APIView):
    """Authenticate with email and password to receive JWT tokens."""
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, responses={200: UserSerializer})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AuthService.authenticate_user(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        user_data = UserSerializer(result['user']).data
        return success_response(
            data={
                'user': user_data,
                'tokens': result['tokens']
            },
            message='Login successful.'
        )

class RefreshTokenView(APIView):
    """Refresh JWT access token."""
    permission_classes = [AllowAny]

    @extend_schema(request=RefreshTokenSerializer)
    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = AuthService.refresh_tokens(serializer.validated_data['refresh'])
        return success_response(data=tokens, message='Token refreshed successfully.')

class LogoutView(APIView):
    """Blacklist refresh token to sign out."""
    permission_classes = [IsAuthenticated]

    @extend_schema(request=LogoutSerializer)
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.logout(serializer.validated_data['refresh'])
        return success_response(message='Logged out successfully.')

class CurrentUserView(APIView):
    """Retrieve or update the currently authenticated user's profile."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserSerializer})
    def get(self, request):
        serializer = UserSerializer(request.user)
        return success_response(data=serializer.data)

    @extend_schema(request=UpdateProfileSerializer, responses={200: UserSerializer})
    def patch(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = UserRepository.update_user(request.user, **serializer.validated_data)
        return success_response(
            data=UserSerializer(updated_user).data,
            message='Profile updated successfully.'
        )
