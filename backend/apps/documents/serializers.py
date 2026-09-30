from rest_framework import serializers
from .models import Document, DocumentVersion, WritingMode, WritingTone, WritingLanguage

class DocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for document listing."""
    snippet = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 
            'title', 
            'snippet',
            'mode', 
            'language', 
            'tone', 
            'word_count', 
            'character_count', 
            'created_at', 
            'updated_at'
        ]

    def get_snippet(self, obj):
        text = obj.content or obj.ai_result or ''
        return (text[:120] + '...') if len(text) > 120 else text

class DocumentDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for document editor workspace."""
    class Meta:
        model = Document
        fields = [
            'id', 
            'title', 
            'content', 
            'ai_result', 
            'mode', 
            'language', 
            'tone', 
            'word_count', 
            'character_count', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'word_count', 'character_count', 'created_at', 'updated_at']

class DocumentCreateUpdateSerializer(serializers.ModelSerializer):
    """Payload serializer for creating or updating a document."""
    title = serializers.CharField(required=False, max_length=255, default='Untitled Document')
    content = serializers.CharField(required=False, allow_blank=True, default='')
    ai_result = serializers.CharField(required=False, allow_blank=True, default='')
    mode = serializers.ChoiceField(choices=WritingMode.choices, default=WritingMode.BLOG)
    language = serializers.ChoiceField(choices=WritingLanguage.choices, default=WritingLanguage.ENGLISH)
    tone = serializers.ChoiceField(choices=WritingTone.choices, default=WritingTone.SIMPLE)

    class Meta:
        model = Document
        fields = ['title', 'content', 'ai_result', 'mode', 'language', 'tone']

class DocumentVersionSerializer(serializers.ModelSerializer):
    """Document version serializer."""
    class Meta:
        model = DocumentVersion
        fields = [
            'id', 
            'document', 
            'version_number', 
            'title', 
            'content', 
            'ai_result', 
            'change_summary', 
            'created_at'
        ]
        read_only_fields = ['id', 'document', 'version_number', 'created_at']

class CreateVersionRequestSerializer(serializers.Serializer):
    change_summary = serializers.CharField(required=False, default='User saved snapshot', max_length=255)
