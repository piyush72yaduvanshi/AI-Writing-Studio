from typing import Optional
from django.db.models import QuerySet, Q
from .models import WritingReference, ReferenceChunk, ReferenceStatus

class WritingReferenceRepository:
    """Data access repository for WritingReference."""

    @staticmethod
    def get_user_references(user, category: Optional[str] = None) -> QuerySet[WritingReference]:
        qs = WritingReference.objects.filter(Q(user=user) | Q(is_global=True))
        if category:
            qs = qs.filter(category=category)
        return qs.order_by('-created_at')

    @staticmethod
    def get_by_id(user, reference_id) -> Optional[WritingReference]:
        return WritingReference.objects.filter(Q(user=user) | Q(is_global=True), id=reference_id).first()

    @staticmethod
    def create(user, **fields) -> WritingReference:
        return WritingReference.objects.create(user=user, **fields)

    @staticmethod
    def update_status(reference: WritingReference, status: ReferenceStatus, chunk_count: int = 0, error_message: Optional[str] = None) -> WritingReference:
        reference.status = status
        reference.chunk_count = chunk_count
        reference.error_message = error_message
        reference.save()
        return reference

    @staticmethod
    def delete(reference: WritingReference) -> None:
        reference.delete()

    @staticmethod
    def create_chunks(reference: WritingReference, chunks_data: list) -> list:
        # Clear any prior chunks
        ReferenceChunk.objects.filter(reference=reference).delete()
        chunks = [
            ReferenceChunk(
                reference=reference,
                chunk_index=item['chunk_index'],
                text=item['text'],
                qdrant_point_id=item['qdrant_point_id']
            )
            for item in chunks_data
        ]
        return ReferenceChunk.objects.bulk_create(chunks)
