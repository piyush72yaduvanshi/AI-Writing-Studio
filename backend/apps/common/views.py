import httpx
from django.db import connection
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import redis
import logging

logger = logging.getLogger('apps.common')

class HealthCheckView(APIView):
    """
    Health check endpoint returning statuses of Database, Redis, Ollama, and Qdrant.
    Accessible publicly without auth for container orchestration / health probes.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        services = {}
        all_healthy = True

        # 1. Database check
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
                if row and row[0] == 1:
                    services['database'] = {'status': 'healthy', 'type': connection.vendor}
                else:
                    services['database'] = {'status': 'unhealthy', 'error': 'Unexpected query result'}
                    all_healthy = False
        except Exception as e:
            services['database'] = {'status': 'unhealthy', 'error': str(e)}
            all_healthy = False

        # 2. Redis check
        try:
            r = redis.from_url(settings.REDIS_URL, socket_timeout=2)
            r.ping()
            services['redis'] = {'status': 'healthy'}
        except Exception as e:
            services['redis'] = {'status': 'unhealthy', 'error': str(e)}
            all_healthy = False

        # 3. AI Providers check (Gemini, OpenRouter, OpenAI, Ollama)
        gemini_ready = bool(getattr(settings, 'GEMINI_API_KEY', ''))
        openrouter_ready = bool(getattr(settings, 'OPENROUTER_API_KEY', ''))
        openai_ready = bool(getattr(settings, 'OPENAI_API_KEY', ''))
        
        ollama_status = {'status': 'not_configured'}
        try:
            with httpx.Client(timeout=1.5) as client:
                res = client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if res.status_code == 200:
                    models = [m.get('name') for m in res.json().get('models', [])]
                    ollama_status = {
                        'status': 'healthy',
                        'base_url': settings.OLLAMA_BASE_URL,
                        'available_models': models
                    }
        except Exception:
            ollama_status = {'status': 'inactive', 'note': 'Cloud AI providers active'}

        services['ai_providers'] = {
            'gemini': {'status': 'ready' if gemini_ready else 'not_configured', 'model': getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash')},
            'openrouter': {'status': 'ready' if openrouter_ready else 'not_configured', 'model': getattr(settings, 'OPENROUTER_MODEL', 'deepseek/deepseek-chat')},
            'openai': {'status': 'ready' if openai_ready else 'not_configured', 'model': getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini')},
            'ollama': ollama_status,
        }

        # Any AI provider being ready is sufficient for AI health
        has_ai_ready = gemini_ready or openrouter_ready or openai_ready or (ollama_status.get('status') == 'healthy')
        if not has_ai_ready:
            # Degraded if no AI key configured at all
            services['ai_providers']['warning'] = 'No cloud API key or local Ollama available'

        # 4. Qdrant check
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{settings.QDRANT_URL}/healthz")
                if res.status_code == 200:
                    services['qdrant'] = {'status': 'healthy', 'url': settings.QDRANT_URL}
                else:
                    services['qdrant'] = {'status': 'unhealthy', 'status_code': res.status_code}
                    all_healthy = False
        except Exception as e:
            services['qdrant'] = {'status': 'unreachable', 'error': str(e)}
            all_healthy = False

        status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response({
            'success': all_healthy,
            'status': 'healthy' if all_healthy else 'degraded',
            'environment': getattr(settings, 'ENVIRONMENT', 'development'),
            'services': services
        }, status=status_code)
