from typing import Optional, List
from django.db.models import QuerySet, Q
from .models import Document, DocumentVersion

class DocumentRepository:
    """Data access repository for Document model."""

    @staticmethod
    def get_user_documents(user, search: Optional[str] = None, mode: Optional[str] = None, language: Optional[str] = None, sort_by: str = '-updated_at') -> QuerySet[Document]:
        qs = Document.objects.filter(user=user)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(content__icontains=search))
        if mode:
            qs = qs.filter(mode=mode)
        if language:
            qs = qs.filter(language=language)
        
        allowed_sorts = ['-updated_at', 'updated_at', '-created_at', 'created_at', 'title', '-title']
        if sort_by in allowed_sorts:
            qs = qs.order_by(sort_by)
        else:
            qs = qs.order_by('-updated_at')
        return qs

    @staticmethod
    def get_by_id(user, document_id) -> Optional[Document]:
        return Document.objects.filter(user=user, id=document_id).first()

    @staticmethod
    def create(user, **fields) -> Document:
        return Document.objects.create(user=user, **fields)

    @staticmethod
    def update(document: Document, **fields) -> Document:
        for key, value in fields.items():
            if hasattr(document, key):
                setattr(document, key, value)
        document.save()
        return document

    @staticmethod
    def delete(document: Document) -> None:
        document.delete()

class DocumentVersionRepository:
    """Data access repository for DocumentVersion model."""

    @staticmethod
    def get_versions(document: Document) -> QuerySet[DocumentVersion]:
        return DocumentVersion.objects.filter(document=document).order_by('-version_number')

    @staticmethod
    def get_latest_version_number(document: Document) -> int:
        latest = DocumentVersion.objects.filter(document=document).order_by('-version_number').first()
        return latest.version_number if latest else 0

    @staticmethod
    def get_version_by_id(document: Document, version_id) -> Optional[DocumentVersion]:
        return DocumentVersion.objects.filter(document=document, id=version_id).first()

    @staticmethod
    def create_version(document: Document, change_summary: str = 'Saved version') -> DocumentVersion:
        next_ver = DocumentVersionRepository.get_latest_version_number(document) + 1
        return DocumentVersion.objects.create(
            document=document,
            version_number=next_ver,
            title=document.title,
            content=document.content,
            ai_result=document.ai_result,
            change_summary=change_summary,
        )
