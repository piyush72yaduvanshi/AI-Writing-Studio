from rest_framework.response import Response
from rest_framework import status
from typing import Any, Optional

def success_response(data: Any = None, message: str = 'Operation completed successfully.', status_code: int = status.HTTP_200_OK) -> Response:
    """Standard success API response."""
    payload = {
        'success': True,
        'message': message,
        'data': data if data is not None else {}
    }
    return Response(payload, status=status_code)
