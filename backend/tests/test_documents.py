import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.documents.models import Document, WritingMode, WritingLanguage, WritingTone

User = get_user_model()

@pytest.mark.django_db
class TestDocuments:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='docuser@example.com', password='Password123!', username='docuser')
        self.client.force_authenticate(user=self.user)
        self.base_url = '/api/v1/documents/'

    def test_create_and_retrieve_document(self):
        payload = {
            'title': 'My First Screenplay',
            'content': 'INT. CAFE - NIGHT\nRohit stares at the untouched coffee.',
            'mode': WritingMode.SCREENPLAY,
            'language': WritingLanguage.ENGLISH,
            'tone': WritingTone.CINEMATIC
        }
        res = self.client.post(self.base_url, payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        doc_id = res.data['data']['id']
        assert res.data['data']['word_count'] > 0
        assert res.data['data']['character_count'] > 0

        # Retrieve
        get_res = self.client.get(f"{self.base_url}{doc_id}")
        assert get_res.status_code == status.HTTP_200_OK
        assert get_res.data['data']['title'] == 'My First Screenplay'

    def test_duplicate_document(self):
        doc = Document.objects.create(
            user=self.user,
            title='Original Story',
            content='Once upon a time in Mumbai...',
            mode=WritingMode.STORY
        )
        dup_res = self.client.post(f"{self.base_url}{doc.id}/duplicate")
        assert dup_res.status_code == status.HTTP_201_CREATED
        assert dup_res.data['data']['title'] == 'Original Story (Copy)'
        assert dup_res.data['data']['content'] == doc.content
        assert dup_res.data['data']['id'] != str(doc.id)

    def test_version_checkpoint_and_restore(self):
        doc = Document.objects.create(
            user=self.user,
            title='Versioned Article',
            content='Draft 1 content here.',
            mode=WritingMode.ARTICLE
        )
        # Create version 1
        ver_res = self.client.post(f"{self.base_url}{doc.id}/versions", {'change_summary': 'Initial draft'}, format='json')
        assert ver_res.status_code == status.HTTP_201_CREATED
        v1_id = ver_res.data['data']['id']

        # Edit doc
        self.client.patch(f"{self.base_url}{doc.id}", {'content': 'Draft 2 completely modified.'}, format='json')
        doc.refresh_from_db()
        assert doc.content == 'Draft 2 completely modified.'

        # Restore version 1
        restore_res = self.client.post(f"{self.base_url}{doc.id}/restore/{v1_id}")
        assert restore_res.status_code == status.HTTP_200_OK
        assert restore_res.data['data']['content'] == 'Draft 1 content here.'

    def test_user_isolation(self):
        other_user = User.objects.create_user(email='other@example.com', password='Password123!', username='other')
        other_doc = Document.objects.create(user=other_user, title='Secret Doc')

        res = self.client.get(f"{self.base_url}{other_doc.id}")
        assert res.status_code == status.HTTP_404_NOT_FOUND
