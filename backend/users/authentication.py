from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework.authentication import get_authorization_header


class SafeJWTAuthentication(JWTAuthentication):
    """
    JWT Authentication that doesn't raise exceptions on invalid tokens.
    Instead, it returns None for unauthenticated users, allowing AllowAny() 
    permissions to work correctly.
    """
    def authenticate(self, request):
        header = get_authorization_header(request).split()
        
        if not header or header[0].lower() != b'bearer':
            return None
        
        if len(header) == 1:
            return None
        
        if len(header) > 2:
            return None
        
        try:
            return super().authenticate(request)
        except (InvalidToken, AuthenticationFailed):
            return None
        except Exception:
            return None

