from django.urls import re_path
from .views import (
    DocumentListCreateView,
    DocumentDetailView,
    DocumentDuplicateView,
    DocumentVersionListView,
    DocumentRestoreVersionView,
)

urlpatterns = [
    re_path(r'^$', DocumentListCreateView.as_view(), name='document-list-create'),
    re_path(r'^(?P<pk>[0-9a-f-]+)/?$', DocumentDetailView.as_view(), name='document-detail'),
    re_path(r'^(?P<pk>[0-9a-f-]+)/duplicate/?$', DocumentDuplicateView.as_view(), name='document-duplicate'),
    re_path(r'^(?P<pk>[0-9a-f-]+)/versions/?$', DocumentVersionListView.as_view(), name='document-versions'),
    re_path(r'^(?P<pk>[0-9a-f-]+)/restore/(?P<version_id>[0-9a-f-]+)/?$', DocumentRestoreVersionView.as_view(), name='document-restore-version'),
]
