import logging
from typing import List, Dict, Any, Optional
from django.conf import settings
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from apps.common.exceptions import ApplicationError

logger = logging.getLogger('apps.references')

class QdrantVectorStore:
    """Manages collection initialization, embedding indexing, and vector similarity search in Qdrant."""

    def __init__(self):
        self.host = settings.QDRANT_HOST
        self.port = settings.QDRANT_PORT
        self.url = settings.QDRANT_URL
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self._client: Optional[QdrantClient] = None

    @property
    def client(self) -> QdrantClient:
        if self._client is None:
            self._client = QdrantClient(url=self.url, timeout=10.0)
        return self._client

    def ensure_collection(self, vector_size: int = 768) -> None:
        """Ensure Qdrant collection exists with proper vector size."""
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                logger.info(f"Creating Qdrant collection '{self.collection_name}' with dimension {vector_size}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=vector_size,
                        distance=qmodels.Distance.COSINE
                    )
                )
        except Exception as exc:
            logger.error(f"Error ensuring Qdrant collection: {exc}")
            raise ApplicationError(
                message=f"Could not connect to Qdrant vector database at {self.url}.",
                code="QDRANT_CONNECTION_ERROR",
                status_code=503,
                details={'error': str(exc)}
            )

    def upsert_chunks(self, points: List[Dict[str, Any]]) -> None:
        """
        Upsert a batch of points to Qdrant.
        Each point dict contains: id (UUID string), vector (List[float]), payload (dict).
        """
        if not points:
            return

        vector_size = len(points[0]['vector'])
        self.ensure_collection(vector_size=vector_size)

        qdrant_points = [
            qmodels.PointStruct(
                id=str(p['id']),
                vector=p['vector'],
                payload=p['payload']
            )
            for p in points
        ]

        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=qdrant_points,
                wait=True
            )
        except Exception as exc:
            logger.error(f"Failed to upsert points into Qdrant: {exc}")
            raise ApplicationError(
                message="Failed to index document embeddings into Qdrant vector database.",
                code="VECTOR_INDEX_ERROR",
                status_code=502,
                details={'error': str(exc)}
            )

    def delete_reference_points(self, reference_id: str) -> None:
        """Delete all points associated with a specific reference."""
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=qmodels.FilterSelector(
                    filter=qmodels.Filter(
                        must=[
                            qmodels.FieldCondition(
                                key="reference_id",
                                match=qmodels.MatchValue(value=str(reference_id))
                            )
                        ]
                    )
                )
            )
        except Exception as exc:
            logger.warning(f"Could not delete reference points from Qdrant: {exc}")

    def similarity_search(
        self,
        query_vector: List[float],
        user_id: Optional[str] = None,
        top_k: int = 4,
        similarity_threshold: float = 0.65
    ) -> List[Dict[str, Any]]:
        """
        Query Qdrant for semantic similarity.
        Matches references that are either global OR owned by the specified user.
        """
        try:
            filter_conditions = []
            if user_id:
                filter_conditions.append(
                    qmodels.Filter(
                        should=[
                            qmodels.FieldCondition(key="user_id", match=qmodels.MatchValue(value=str(user_id))),
                            qmodels.FieldCondition(key="is_global", match=qmodels.MatchValue(value=True)),
                        ]
                    )
                )

            query_filter = filter_conditions[0] if filter_conditions else None

            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=top_k,
                score_threshold=similarity_threshold,
                query_filter=query_filter
            )

            matched_chunks = []
            for hit in results:
                payload = hit.payload or {}
                matched_chunks.append({
                    'score': hit.score,
                    'text': payload.get('text', ''),
                    'title': payload.get('title', ''),
                    'reference_id': payload.get('reference_id', ''),
                    'category': payload.get('category', ''),
                })
            return matched_chunks

        except Exception as exc:
            logger.warning(f"Vector search failed in Qdrant (might be empty collection): {exc}")
            return []
