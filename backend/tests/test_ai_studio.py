import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.documents.models import Document, WritingMode
from apps.ai_studio.providers import AIResponse
from apps.ai_studio.models import AIRequest

User = get_user_model()

@pytest.mark.django_db
class TestAIStudio:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='aiwriter@example.com', password='Password123!', username='aiwriter')
        self.client.force_authenticate(user=self.user)
        self.cache_patcher = patch('apps.ai_studio.services.WritingService._get_cache_client', return_value=None)
        self.cache_patcher.start()

    def teardown_method(self):
        self.cache_patcher.stop()

    @patch('apps.ai_studio.services.get_default_ai_provider')
    def test_improve_writing_action(self, mock_provider_func):
        mock_provider = MagicMock()
        mock_provider.model = 'qwen3:8b'
        mock_provider.generate.return_value = AIResponse(
            text="The sun descended behind the rugged silhouette of the hills, casting deep amber rays across the dry valley floor.",
            model='qwen3:8b',
            input_tokens=142,
            output_tokens=68,
            duration_ms=450
        )
        mock_provider_func.return_value = mock_provider

        doc = Document.objects.create(
            user=self.user,
            title='Sunset Scene',
            content='Suraj pahaad ke peeche dhal raha tha aur sab taraf laal roshni phail gayi thi.',
            mode=WritingMode.STORY
        )

        payload = {
            'content': doc.content,
            'document_id': str(doc.id),
            'mode': 'story',
            'language': 'English',
            'tone': 'Cinematic',
            'use_rag': False,
            'save_version': True
        }

        res = self.client.post('/api/v1/ai/improve', payload, format='json')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['success'] is True
        assert 'rugged silhouette' in res.data['data']['content']
        assert res.data['data']['model'] == 'qwen3:8b'

        # Verify audit log was created
        log = AIRequest.objects.filter(user=self.user, action='improve').first()
        assert log is not None
        assert log.status == 'SUCCESS'
        assert log.output_tokens == 68

        # Verify doc was updated
        doc.refresh_from_db()
        assert 'rugged silhouette' in doc.ai_result

    @patch('apps.ai_studio.services.get_default_ai_provider')
    def test_translate_hinglish_to_english(self, mock_provider_func):
        mock_provider = MagicMock()
        mock_provider.model = 'qwen3:8b'
        mock_provider.generate.return_value = AIResponse(
            text="I will write an in-depth article tomorrow about the future implications of artificial intelligence.",
            model='qwen3:8b',
            input_tokens=60,
            output_tokens=25,
            duration_ms=180
        )
        mock_provider_func.return_value = mock_provider

        payload = {
            'content': 'mai kal ek article likhunga ai ke future ke bare me',
            'mode': 'article',
            'language': 'English',
            'tone': 'Simple',
            'use_rag': False
        }

        res = self.client.post('/api/v1/ai/translate', payload, format='json')
        assert res.status_code == status.HTTP_200_OK
        assert 'future implications of artificial intelligence' in res.data['data']['content']

    def test_empty_content_rejected(self):
        res = self.client.post('/api/v1/ai/improve', {'content': '   '}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
