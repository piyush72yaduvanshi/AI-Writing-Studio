from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.common.responses import success_response
from apps.common.pagination import StandardResultsSetPagination
from .serializers import (
    DocumentListSerializer,
    DocumentDetailSerializer,
    DocumentCreateUpdateSerializer,
    DocumentVersionSerializer,
    CreateVersionRequestSerializer,
)
from .services import DocumentService

class DocumentListCreateView(APIView):
    """List documents for current user or create a new one."""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        parameters=[
            OpenApiParameter(name='search', type=str, description='Search by title or content'),
            OpenApiParameter(name='mode', type=str, description='Filter by mode (blog, article, story, etc.)'),
            OpenApiParameter(name='language', type=str, description='Filter by language (English, Hindi, Hinglish)'),
            OpenApiParameter(name='sort_by', type=str, description='Order by field: -updated_at, updated_at, title, etc.'),
        ],
        responses={200: DocumentListSerializer(many=True)}
    )
    def get(self, request):
        search = request.query_params.get('search')
        mode = request.query_params.get('mode')
        language = request.query_params.get('language')
        sort_by = request.query_params.get('sort_by', '-updated_at')

        queryset = DocumentService.list_documents(
            user=request.user,
            search=search,
            mode=mode,
            language=language,
            sort_by=sort_by
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = DocumentListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(request=DocumentCreateUpdateSerializer, responses={201: DocumentDetailSerializer})
    def post(self, request):
        serializer = DocumentCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doc = DocumentService.create_document(request.user, serializer.validated_data)
        return success_response(
            data=DocumentDetailSerializer(doc).data,
            message='Document created successfully.',
            status_code=status.HTTP_201_CREATED
        )

class DocumentDetailView(APIView):
    """Retrieve, update, or delete a specific document."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: DocumentDetailSerializer})
    def get(self, request, pk):
        doc = DocumentService.get_document(request.user, pk)
        return success_response(data=DocumentDetailSerializer(doc).data)

    @extend_schema(request=DocumentCreateUpdateSerializer, responses={200: DocumentDetailSerializer})
    def patch(self, request, pk):
        serializer = DocumentCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        doc = DocumentService.update_document(request.user, pk, serializer.validated_data)
        return success_response(
            data=DocumentDetailSerializer(doc).data,
            message='Document updated successfully.'
        )

    def delete(self, request, pk):
        DocumentService.delete_document(request.user, pk)
        return success_response(message='Document deleted successfully.')

class DocumentDuplicateView(APIView):
    """Duplicate an existing document."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={201: DocumentDetailSerializer})
    def post(self, request, pk):
        duplicate = DocumentService.duplicate_document(request.user, pk)
        return success_response(
            data=DocumentDetailSerializer(duplicate).data,
            message='Document duplicated successfully.',
            status_code=status.HTTP_201_CREATED
        )

class DocumentVersionListView(APIView):
    """List or create snapshots/versions for a document."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: DocumentVersionSerializer(many=True)})
    def get(self, request, pk):
        versions = DocumentService.list_versions(request.user, pk)
        return success_response(
            data=DocumentVersionSerializer(versions, many=True).data,
            message='Versions retrieved successfully.'
        )

    @extend_schema(request=CreateVersionRequestSerializer, responses={201: DocumentVersionSerializer})
    def post(self, request, pk):
        serializer = CreateVersionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        version = DocumentService.create_version(
            user=request.user,
            document_id=pk,
            change_summary=serializer.validated_data.get('change_summary', 'Manual checkpoint')
        )
        return success_response(
            data=DocumentVersionSerializer(version).data,
            message='Version checkpoint created successfully.',
            status_code=status.HTTP_201_CREATED
        )

class DocumentRestoreVersionView(APIView):
    """Restore a document to a previous version."""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: DocumentDetailSerializer})
    def post(self, request, pk, version_id):
        doc = DocumentService.restore_version(request.user, pk, version_id)
        return success_response(
            data=DocumentDetailSerializer(doc).data,
            message=f'Restored document to version.'
        )
