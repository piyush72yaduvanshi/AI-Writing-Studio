from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger('apps.common')

class ApplicationError(Exception):
    """Base application exception with error code and status."""
    def __init__(self, message: str, code: str = 'APPLICATION_ERROR', status_code: int = status.HTTP_400_BAD_REQUEST, details: dict = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}

def custom_exception_handler(exc, context):
    """
    Standardized DRF Exception Handler.
    Matches specification:
    {
      "success": false,
      "message": "...",
      "error": {
        "code": "...",
        "details": {}
      }
    }
    """
    if isinstance(exc, ApplicationError):
        return Response({
            'success': False,
            'message': exc.message,
            'error': {
                'code': exc.code,
                'details': exc.details,
            }
        }, status=exc.status_code)

    response = exception_handler(exc, context)

    if response is not None:
        error_code = 'VALIDATION_ERROR'
        message = 'A validation or request error occurred.'
        
        if response.status_code == 401:
            error_code = 'UNAUTHORIZED'
            message = 'Authentication credentials were not provided or are invalid.'
        elif response.status_code == 403:
            error_code = 'FORBIDDEN'
            message = 'You do not have permission to perform this action.'
        elif response.status_code == 404:
            error_code = 'NOT_FOUND'
            message = 'The requested resource was not found.'
        elif response.status_code == 405:
            error_code = 'METHOD_NOT_ALLOWED'
            message = 'Method not allowed.'
        elif isinstance(response.data, dict) and 'detail' in response.data:
            message = str(response.data['detail'])

        response.data = {
            'success': False,
            'message': message,
            'error': {
                'code': error_code,
                'details': response.data if isinstance(response.data, (dict, list)) else {'detail': response.data},
            }
        }
        return response

    # Catch-all unexpected internal server errors without leaking stack trace to user
    logger.exception('Unhandled Server Exception in request: %s', exc)
    return Response({
        'success': False,
        'message': 'An internal server error occurred. Please try again later.',
        'error': {
            'code': 'INTERNAL_SERVER_ERROR',
            'details': {}
        }
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
