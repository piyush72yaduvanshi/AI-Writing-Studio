from typing import Dict, Any, Optional
from django.db.models import QuerySet
from apps.common.exceptions import ApplicationError
from .models import Document, DocumentVersion
from .repositories import DocumentRepository, DocumentVersionRepository

class DocumentService:
    """Business logic for document management and versioning."""

    @staticmethod
    def list_documents(user, search: Optional[str] = None, mode: Optional[str] = None, language: Optional[str] = None, sort_by: str = '-updated_at') -> QuerySet[Document]:
        return DocumentRepository.get_user_documents(
            user=user,
            search=search,
            mode=mode,
            language=language,
            sort_by=sort_by
        )

    @staticmethod
    def get_document(user, document_id) -> Document:
        doc = DocumentRepository.get_by_id(user, document_id)
        if not doc:
            raise ApplicationError(
                message='Document not found.',
                code='DOCUMENT_NOT_FOUND',
                status_code=404
            )
        return doc

    @staticmethod
    def create_document(user, validated_data: Dict[str, Any]) -> Document:
        return DocumentRepository.create(user=user, **validated_data)

    @staticmethod
    def update_document(user, document_id, validated_data: Dict[str, Any]) -> Document:
        doc = DocumentService.get_document(user, document_id)
        return DocumentRepository.update(doc, **validated_data)

    @staticmethod
    def delete_document(user, document_id) -> None:
        doc = DocumentService.get_document(user, document_id)
        DocumentRepository.delete(doc)

    @staticmethod
    def duplicate_document(user, document_id) -> Document:
        source_doc = DocumentService.get_document(user, document_id)
        duplicate = DocumentRepository.create(
            user=user,
            title=f"{source_doc.title} (Copy)",
            content=source_doc.content,
            ai_result=source_doc.ai_result,
            mode=source_doc.mode,
            language=source_doc.language,
            tone=source_doc.tone,
        )
        return duplicate

    @staticmethod
    def create_version(user, document_id, change_summary: str = 'Manual checkpoint') -> DocumentVersion:
        doc = DocumentService.get_document(user, document_id)
        return DocumentVersionRepository.create_version(doc, change_summary=change_summary)

    @staticmethod
    def list_versions(user, document_id) -> QuerySet[DocumentVersion]:
        doc = DocumentService.get_document(user, document_id)
        return DocumentVersionRepository.get_versions(doc)

    @staticmethod
    def restore_version(user, document_id, version_id) -> Document:
        doc = DocumentService.get_document(user, document_id)
        version = DocumentVersionRepository.get_version_by_id(doc, version_id)
        if not version:
            raise ApplicationError(
                message='Document version not found.',
                code='VERSION_NOT_FOUND',
                status_code=404
            )

        # Before restoring, auto-save a safety checkpoint of current state
        DocumentVersionRepository.create_version(doc, change_summary=f"Auto-backup before restoring v{version.version_number}")

        # Restore content and ai_result
        doc.title = version.title
        doc.content = version.content
        doc.ai_result = version.ai_result
        doc.save()
        return doc
