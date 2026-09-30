import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

@pytest.mark.django_db
class TestAuthentication:
    def setup_method(self):
        self.client = APIClient()
        self.register_url = '/api/v1/auth/register'
        self.login_url = '/api/v1/auth/login'
        self.me_url = '/api/v1/auth/me'
        self.refresh_url = '/api/v1/auth/refresh'
        self.logout_url = '/api/v1/auth/logout'

    def test_user_registration_success(self):
        payload = {
            'email': 'writer@example.com',
            'password': 'SecurePassword123!',
            'username': 'creative_writer',
            'preferred_language': 'English',
            'preferred_tone': 'Creative'
        }
        response = self.client.post(self.register_url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert 'tokens' in response.data['data']
        assert 'access' in response.data['data']['tokens']
        assert response.data['data']['user']['email'] == 'writer@example.com'

    def test_duplicate_registration_fails(self):
        User.objects.create_user(email='test@example.com', password='Password123!', username='test')
        payload = {
            'email': 'test@example.com',
            'password': 'DifferentPassword123!'
        }
        response = self.client.post(self.register_url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False
        assert response.data['error']['code'] == 'EMAIL_ALREADY_EXISTS'

    def test_login_and_access_protected_endpoint(self):
        user = User.objects.create_user(email='author@example.com', password='Password123!', username='author')
        login_res = self.client.post(self.login_url, {'email': 'author@example.com', 'password': 'Password123!'}, format='json')
        assert login_res.status_code == status.HTTP_200_OK
        access_token = login_res.data['data']['tokens']['access']

        # Access /me with bearer token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        me_res = self.client.get(self.me_url)
        assert me_res.status_code == status.HTTP_200_OK
        assert me_res.data['data']['email'] == 'author@example.com'

    def test_token_refresh(self):
        user = User.objects.create_user(email='refresh_test@example.com', password='Password123!', username='refresher')
        login_res = self.client.post(self.login_url, {'email': 'refresh_test@example.com', 'password': 'Password123!'}, format='json')
        refresh_token = login_res.data['data']['tokens']['refresh']

        refresh_res = self.client.post(self.refresh_url, {'refresh': refresh_token}, format='json')
        assert refresh_res.status_code == status.HTTP_200_OK
        assert 'access' in refresh_res.data['data']
