from rest_framework import serializers
from .models import WritingReference, ReferenceCategory, ReferenceStatus

class WritingReferenceSerializer(serializers.ModelSerializer):
    """Writing Reference representation serializer."""
    class Meta:
        model = WritingReference
        fields = [
            'id', 
            'title', 
            'category', 
            'is_global', 
            'status', 
            'chunk_count', 
            'error_message', 
            'text_content',
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'status', 'chunk_count', 'error_message', 'created_at', 'updated_at']

class WritingReferenceCreateSerializer(serializers.Serializer):
    """Payload serializer for uploading reference file or raw text."""
    title = serializers.CharField(required=True, max_length=255)
    category = serializers.ChoiceField(choices=ReferenceCategory.choices, default=ReferenceCategory.USER_CUSTOM)
    text_content = serializers.CharField(required=False, allow_blank=True, default='')
    file = serializers.FileField(required=False, allow_null=True)
    async_index = serializers.BooleanField(default=True, required=False)

    def validate(self, attrs):
        file = attrs.get('file')
        text_content = attrs.get('text_content', '').strip()
        if not file and not text_content:
            raise serializers.ValidationError("Either a valid file or raw text content must be provided.")
        return attrs
