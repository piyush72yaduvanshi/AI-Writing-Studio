from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.common.responses import success_response
from apps.common.exceptions import ApplicationError
from .models import WritingReference
from .repositories import WritingReferenceRepository
from .serializers import WritingReferenceSerializer, WritingReferenceCreateSerializer
from .services import ReferenceService
from .extractors import extract_text_from_file

class ReferenceListCreateView(APIView):
    """List reference library items or upload a new reference document."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(
        parameters=[
            OpenApiParameter(name='category', type=str, description='Filter by category')
        ],
        responses={200: WritingReferenceSerializer(many=True)}
    )
    def get(self, request):
        category = request.query_params.get('category')
        refs = WritingReferenceRepository.get_user_references(request.user, category=category)
        return success_response(
            data=WritingReferenceSerializer(refs, many=True).data,
            message="References retrieved successfully."
        )

    @extend_schema(request=WritingReferenceCreateSerializer, responses={201: WritingReferenceSerializer})
    def post(self, request):
        serializer = WritingReferenceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        file_obj = data.get('file')
        raw_text = data.get('text_content', '').strip()

        if file_obj:
            extracted = extract_text_from_file(file_obj, file_obj.name)
            final_text = extracted if not raw_text else f"{raw_text}\n\n{extracted}"
        else:
            final_text = raw_text

        reference = WritingReferenceRepository.create(
            user=request.user,
            title=data['title'],
            category=data.get('category', 'user_custom'),
            file=file_obj,
            text_content=final_text,
            is_global=False
        )

        async_index = data.get('async_index', True)
        ReferenceService.trigger_indexing(reference, async_mode=async_index)

        return success_response(
            data=WritingReferenceSerializer(reference).data,
            message="Reference uploaded and indexing initiated.",
            status_code=status.HTTP_201_CREATED
        )

class ReferenceDetailDeleteView(APIView):
    """Retrieve or delete a specific writing reference."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: WritingReferenceSerializer})
    def get(self, request, pk):
        ref = WritingReferenceRepository.get_by_id(request.user, pk)
        if not ref:
            raise ApplicationError("Reference not found", code="NOT_FOUND", status_code=404)
        return success_response(data=WritingReferenceSerializer(ref).data)

    def delete(self, request, pk):
        ReferenceService.delete_reference(request.user, pk)
        return success_response(message="Reference deleted successfully.")

class ReferenceReindexView(APIView):
    """Trigger re-indexing of a reference into Qdrant."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: WritingReferenceSerializer})
    def post(self, request, pk):
        ref = WritingReferenceRepository.get_by_id(request.user, pk)
        if not ref:
            raise ApplicationError("Reference not found", code="NOT_FOUND", status_code=404)
        ReferenceService.trigger_indexing(ref, async_mode=False)
        ref.refresh_from_db()
        return success_response(
            data=WritingReferenceSerializer(ref).data,
            message="Reference re-indexed successfully."
        )
