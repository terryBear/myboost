"""
Role-based permissions using JWT/user groups.
Share link: allow GET when valid X-Share-Token so report viewers can navigate.
"""

from rest_framework.permissions import BasePermission


def _valid_share_token(request):
    """Return True if request has a valid share token (header or query)."""
    token = (
        (request.META.get("HTTP_X_SHARE_TOKEN") or "")
        or (
            getattr(request, "query_params", None)
            and request.query_params.get("share_token")
            or ""
        )
        or ""
    ).strip()
    if not token:
        return False
    from shareable_report.signing_utils import verify_share_token

    return verify_share_token(token) is not None


class AllowAuthenticatedOrValidShareToken(BasePermission):
    """
    Allow request if user is authenticated (JWT) or has valid X-Share-Token / share_token.
    Use on report list endpoints so share-link viewers can load data when navigating.
    """

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return True
        return _valid_share_token(request)


class IsAdminOrReadOnly(BasePermission):
    """
    Allow read (GET, HEAD, OPTIONS) to any authenticated user.
    Allow write and other methods only to staff or users in the 'Admin' group.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return _is_admin(request.user)


class IsAdminUser(BasePermission):
    """Allow only staff or users in the 'Admin' group."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return _is_admin(request.user)


def _is_admin(user):
    if getattr(user, "is_staff", False):
        return True
    if hasattr(user, "groups") and user.groups.filter(name="Admin").exists():
        return True
    return False
