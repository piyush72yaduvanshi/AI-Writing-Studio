from rest_framework import serializers
from .models import AIRequest
from apps.documents.models import WritingMode, WritingLanguage, WritingTone

class AIOperationRequestSerializer(serializers.Serializer):
    """Payload for writing transformation actions."""
    content = serializers.CharField(required=True, allow_blank=False)
    document_id = serializers.UUIDField(required=False, allow_null=True)
    mode = serializers.ChoiceField(choices=WritingMode.choices, default=WritingMode.BLOG, required=False)
    language = serializers.ChoiceField(choices=WritingLanguage.choices, default=WritingLanguage.ENGLISH, required=False)
    tone = serializers.ChoiceField(choices=WritingTone.choices, default=WritingTone.SIMPLE, required=False)
    custom_instruction = serializers.CharField(required=False, allow_blank=True, default='')
    use_rag = serializers.BooleanField(default=True, required=False)
    save_version = serializers.BooleanField(default=False, required=False)
    provider = serializers.CharField(required=False, allow_blank=True, default='')
    model = serializers.CharField(required=False, allow_blank=True, default='')
    api_key = serializers.CharField(required=False, allow_blank=True, default='')

class AIActionDispatcherSerializer(AIOperationRequestSerializer):
    """Payload when specifying custom action name dynamically."""
    action = serializers.CharField(required=True)

class AIResponseDataSerializer(serializers.Serializer):
    """Output serializer for AI generated content."""
    content = serializers.CharField()
    action = serializers.CharField()
    model = serializers.CharField()
    provider = serializers.CharField(default='openrouter')
    duration_ms = serializers.IntegerField()
    input_tokens = serializers.IntegerField()
    output_tokens = serializers.IntegerField()
    cached = serializers.BooleanField(default=False)
    document_id = serializers.UUIDField(allow_null=True, required=False)

class AIRequestLogSerializer(serializers.ModelSerializer):
    """Serializer for AI execution audit log."""
    document_title = serializers.CharField(source='document.title', read_only=True, default=None)

    class Meta:
        model = AIRequest
        fields = [
            'id',
            'action',
            'model',
            'input_tokens',
            'output_tokens',
            'duration_ms',
            'status',
            'error_message',
            'document',
            'document_title',
            'created_at',
        ]
