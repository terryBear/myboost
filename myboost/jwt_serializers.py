"""
Custom JWT serializers: add user groups and role to token payload.
Frontend and backend use these for role-based checks.
Access token gets groups/role so the client can read them without calling an API.
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


def _user_role(user):
    """Derive role string: 'admin' if staff or in Admin group, else 'user'."""
    if not user or not user.is_authenticated:
        return "user"
    if getattr(user, "is_staff", False):
        return "admin"
    if hasattr(user, "groups") and user.groups.filter(name="Admin").exists():
        return "admin"
    return "user"


def _user_groups(user):
    """Return list of group names for the user."""
    if not user or not hasattr(user, "groups"):
        return []
    return list(user.groups.values_list("name", flat=True))


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Add groups and role to both refresh and access token payloads."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["groups"] = _user_groups(user)
        token["role"] = _user_role(user)
        token["username"] = getattr(user, "username", "") or ""
        # Also add to access token (frontend uses access token)
        access = token.access_token
        access["groups"] = token["groups"]
        access["role"] = token["role"]
        access["username"] = token["username"]
        return token
