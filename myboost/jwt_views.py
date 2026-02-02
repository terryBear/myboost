"""Custom JWT views using serializers that add groups/role to the token."""

from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from .jwt_serializers import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]
