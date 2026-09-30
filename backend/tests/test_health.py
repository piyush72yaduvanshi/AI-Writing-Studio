import pytest
from rest_framework.test import APIClient

@pytest.mark.django_db
class TestHealth:
    def test_health_check_endpoint(self):
        client = APIClient()
        response = client.get('/api/v1/health/')
        # Should return 200 or 503 depending on live external dependencies, but always valid json with services dict
        assert 'services' in response.data
        assert 'database' in response.data['services']
