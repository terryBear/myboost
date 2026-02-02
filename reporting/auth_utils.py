"""
JWT validation for non-DRF views (e.g. SPA-serving views).
Redirects to login when token is missing or invalid.
"""

from functools import wraps

from django.http import HttpResponseRedirect
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken


def _get_jwt_from_request(request):
    """Get JWT from Authorization: Bearer header or from access_token cookie (for full page loads)."""
    auth = request.META.get("HTTP_AUTHORIZATION") or ""
    parts = auth.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return request.COOKIES.get("access_token")


def _is_valid_jwt(token_string):
    try:
        AccessToken(token_string)
        return True
    except InvalidToken:
        return False


def require_jwt_for_spa(login_path):
    """
    Decorator for SPA-serving views: require valid JWT unless request path is the login page.
    If path ends with /login (or equals login_path), allow without JWT.
    Otherwise require Authorization: Bearer <valid_token>; if missing/invalid, redirect to login_path.
    """

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped(request, *args, **kwargs):
            path = (request.path or "").rstrip("/")
            login_path_stripped = login_path.rstrip("/")
            if path.endswith("/login") or path == login_path_stripped:
                return view_func(request, *args, **kwargs)
            token = _get_jwt_from_request(request)
            if not token or not _is_valid_jwt(token):
                return HttpResponseRedirect(login_path)
            return view_func(request, *args, **kwargs)

        return _wrapped

    return decorator
