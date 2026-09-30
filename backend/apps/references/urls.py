from django.urls import re_path
from .views import (
    ReferenceListCreateView,
    ReferenceDetailDeleteView,
    ReferenceReindexView,
)

urlpatterns = [
    re_path(r'^$', ReferenceListCreateView.as_view(), name='reference-list-create'),
    re_path(r'^(?P<pk>[0-9a-f-]+)/?$', ReferenceDetailDeleteView.as_view(), name='reference-detail-delete'),
    re_path(r'^(?P<pk>[0-9a-f-]+)/index/?$', ReferenceReindexView.as_view(), name='reference-reindex'),
]
