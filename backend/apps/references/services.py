import uuid
import logging
from celery import shared_task
from django.conf import settings

from .models import WritingReference, ReferenceStatus
from .repositories import WritingReferenceRepository
from .chunker import chunk_text
from .vector_store import QdrantVectorStore
from apps.ai_studio.providers import get_default_ai_provider

logger = logging.getLogger('apps.references')

@shared_task(bind=True, max_retries=2)
def process_reference_indexing_task(self, reference_id: str):
    """Celery background task for asynchronous document chunking and vector indexing."""
    try:
        reference = WritingReference.objects.get(id=reference_id)
        ReferenceService.index_reference_content(reference)
    except Exception as exc:
        logger.error(f"Task error indexing reference {reference_id}: {exc}")
        WritingReference.objects.filter(id=reference_id).update(
            status=ReferenceStatus.FAILED,
            error_message=str(exc)
        )
        raise self.retry(exc=exc, countdown=10)

class ReferenceService:
    """Business logic for writing reference management and RAG indexing."""

    @staticmethod
    def index_reference_content(reference: WritingReference) -> None:
        """Synchronously or worker-driven index of reference text into Qdrant."""
        WritingReferenceRepository.update_status(reference, ReferenceStatus.PROCESSING)

        text = reference.text_content.strip()
        if not text:
            WritingReferenceRepository.update_status(
                reference, 
                ReferenceStatus.FAILED, 
                error_message="Document contains no extractable text."
            )
            return

        chunks = chunk_text(text)
        if not chunks:
            WritingReferenceRepository.update_status(
                reference, 
                ReferenceStatus.FAILED, 
                error_message="Failed to split document into readable chunks."
            )
            return

        ai_provider = get_default_ai_provider()
        vector_store = QdrantVectorStore()

        qdrant_points = []
        chunks_db_data = []

        for idx, chunk_text_content in enumerate(chunks):
            point_id = uuid.uuid4()
            try:
                embedding = ai_provider.get_embedding(chunk_text_content)
            except Exception as e:
                logger.error(f"Embedding failed for chunk {idx}: {e}")
                WritingReferenceRepository.update_status(
                    reference, 
                    ReferenceStatus.FAILED, 
                    error_message=f"Embedding generation failed: {str(e)}"
                )
                return

            qdrant_points.append({
                'id': point_id,
                'vector': embedding,
                'payload': {
                    'reference_id': str(reference.id),
                    'user_id': str(reference.user.id),
                    'is_global': reference.is_global,
                    'title': reference.title,
                    'category': reference.category,
                    'chunk_index': idx,
                    'text': chunk_text_content,
                }
            })

            chunks_db_data.append({
                'chunk_index': idx,
                'text': chunk_text_content,
                'qdrant_point_id': point_id,
            })

        # Upsert into Qdrant
        vector_store.upsert_chunks(qdrant_points)

        # Store chunk records in DB
        WritingReferenceRepository.create_chunks(reference, chunks_db_data)

        # Mark completed
        WritingReferenceRepository.update_status(
            reference, 
            ReferenceStatus.COMPLETED, 
            chunk_count=len(chunks)
        )
        logger.info(f"Successfully indexed reference '{reference.title}' with {len(chunks)} chunks.")

    @staticmethod
    def trigger_indexing(reference: WritingReference, async_mode: bool = True) -> None:
        if async_mode:
            try:
                process_reference_indexing_task.delay(str(reference.id))
                WritingReferenceRepository.update_status(reference, ReferenceStatus.PROCESSING)
                return
            except Exception as exc:
                logger.warning(f"Could not queue Celery task, falling back to synchronous execution: {exc}")
        
        # Synchronous fallback
        ReferenceService.index_reference_content(reference)

    @staticmethod
    def delete_reference(user, reference_id: str) -> None:
        reference = WritingReferenceRepository.get_by_id(user, reference_id)
        if not reference:
            return
        # Delete from Qdrant
        vector_store = QdrantVectorStore()
        vector_store.delete_reference_points(str(reference.id))
        WritingReferenceRepository.delete(reference)

    @staticmethod
    def retrieve_relevant_context(query: str, user_id: str, top_k: int = 4, threshold: float = 0.65) -> list:
        """Embeds the query and queries Qdrant for semantic references."""
        if not query.strip():
            return []
        try:
            ai_provider = get_default_ai_provider()
            query_vector = ai_provider.get_embedding(query[:1000])
            vector_store = QdrantVectorStore()
            results = vector_store.similarity_search(
                query_vector=query_vector,
                user_id=user_id,
                top_k=top_k,
                similarity_threshold=threshold
            )
            return [r['text'] for r in results if r.get('text')]
        except Exception as exc:
            logger.warning(f"RAG retrieval skipped due to error: {exc}")
            return []
