from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
import json
import requests
import xmltodict

from .models import Provider
from .serializers import ProviderSerializer


@api_view(["GET"])
def list_providers(request):
    try:
        queryset = Provider.objects.all()
        serializer = ProviderSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)
    except Exception as e:
        print(e)
        return Response(
            {"error": f"An error occurred while fetching the provider. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
