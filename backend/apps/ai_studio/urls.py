from django.urls import re_path
from .views import (
    ImproveWritingView,
    FixGrammarView,
    TranslateView,
    RewriteView,
    ExpandView,
    ShortenView,
    StructureView,
    ScreenplayView,
    StoryView,
    AIActionDispatcherView,
    AIRequestHistoryView,
    AIConfigStatusView,
    AsyncAIOperationView,
    AsyncAITaskStatusView,
)

urlpatterns = [
    re_path(r'^improve/?$', ImproveWritingView.as_view(), name='ai-improve'),
    re_path(r'^grammar/?$', FixGrammarView.as_view(), name='ai-grammar'),
    re_path(r'^translate/?$', TranslateView.as_view(), name='ai-translate'),
    re_path(r'^rewrite/?$', RewriteView.as_view(), name='ai-rewrite'),
    re_path(r'^expand/?$', ExpandView.as_view(), name='ai-expand'),
    re_path(r'^shorten/?$', ShortenView.as_view(), name='ai-shorten'),
    re_path(r'^structure/?$', StructureView.as_view(), name='ai-structure'),
    re_path(r'^screenplay/?$', ScreenplayView.as_view(), name='ai-screenplay'),
    re_path(r'^story/?$', StoryView.as_view(), name='ai-story'),
    re_path(r'^action/?$', AIActionDispatcherView.as_view(), name='ai-action-dispatch'),
    re_path(r'^async/?$', AsyncAIOperationView.as_view(), name='ai-async-action'),
    re_path(r'^tasks/(?P<task_id>[a-f0-9\-]+)/?$', AsyncAITaskStatusView.as_view(), name='ai-task-status'),
    re_path(r'^history/?$', AIRequestHistoryView.as_view(), name='ai-history'),
    re_path(r'^config/?$', AIConfigStatusView.as_view(), name='ai-config'),
]
