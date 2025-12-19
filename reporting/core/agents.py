from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
import json


@api_view(["GET"])
def list_agents(request):
    try:
        return Response("Done")
    except Exception as e:
        print(e)
        return Response(
            {"error": f"An error occurred while fetching agents. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
