from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import get_token
from django.views.decorators.http import require_GET

from reporting.auth_utils import require_jwt_for_spa


@require_GET
@require_jwt_for_spa("/boostcoffee/login")
def get_client_report(request, path=None):
    """
    Serve the Boost Coffee frontend SPA (client_report.tsx).
    Requires valid JWT unless path is /boostcoffee/login; otherwise redirects to /boostcoffee/login.
    """
    return render(
        request,
        "client_report.html",
        {
            "static_url": settings.STATIC_URL,
            "media_url": settings.MEDIA_URL,
            "csrf_token": get_token(request),
        },
    )
