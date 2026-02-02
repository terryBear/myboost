"""Backup reporting endpoint (optional customerName filter)."""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from myboost.permissions import AllowAuthenticatedOrValidShareToken


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def list_backups(request):
    """Return backup overview; optional customerName query param. Returns list of backup device dicts."""
    # customerName = request.GET.get("customerName")  # use when backup data exists
    # Stub: no backup in sync yet; return [] until backup data is added
    return Response([])


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def list_tickets(request):
    """Return tickets; optional customerName filter. Stub: no ticketing in sync yet."""
    # customerName = request.GET.get("customerName")
    return Response([])
