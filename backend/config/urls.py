from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # OpenAPI 3 Schema & UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API v1 routes
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/documents/', include('apps.documents.urls')),
    path('api/v1/ai/', include('apps.ai_studio.urls')),
    path('api/v1/references/', include('apps.references.urls')),
    path('api/v1/health/', include('apps.common.urls')),
]
