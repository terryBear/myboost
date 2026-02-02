from urllib.parse import quote

from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import get_token
from django.views.decorators.http import require_GET

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from myboost.permissions import IsAdminUser
from .signing_utils import create_share_token, verify_share_token


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def generate_share_link(request):
    """
    Generate a shareable link for a customer's Coffee dashboard.
    Body: { "customer_id": "<id>", "expires_in_days": <optional, default 7> }.
    Returns: { "url": "https://.../s/<token>/" }.
    """
    customer_id = request.data.get("customer_id") or request.query_params.get(
        "customer_id"
    )
    if not customer_id:
        return Response(
            {"error": "customer_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        expires_in_days = int(
            request.data.get("expires_in_days")
            or request.query_params.get("expires_in_days")
            or 7
        )
    except (TypeError, ValueError):
        expires_in_days = 7
    if expires_in_days < 1 or expires_in_days > 365:
        return Response(
            {"error": "expires_in_days must be between 1 and 365."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    token = create_share_token(
        str(customer_id).strip(), expires_in_days=expires_in_days
    )
    base = request.build_absolute_uri("/").rstrip("/")
    # URL-encode token so characters like / and + from Django Signer don't break the path
    url = f"{base}/coffee/s/{quote(token, safe='')}/"
    return Response({"url": url, "expires_in_days": expires_in_days})


@require_GET
def share_view(request, token: str):
    """
    Serve the Coffee dashboard in share mode: no login required.
    Validates the signed token and renders the same SPA with share_token and
    share_customer_id so the frontend can fetch scoped data using the token.
    """
    payload = verify_share_token(token)
    if not payload:
        return render(
            request,
            "shareable_report/invalid_link.html",
            {"message": "This link is invalid or has expired."},
            status=403,
        )
    return render(
        request,
        "reporting_dashboard.html",
        {
            "static_url": settings.STATIC_URL,
            "media_url": settings.MEDIA_URL,
            "csrf_token": get_token(request),
            "share_token": token,
            "share_customer_id": payload["customer_id"],
        },
    )
