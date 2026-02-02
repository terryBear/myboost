from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import get_token
from django.views.decorators.http import require_GET

from reporting.auth_utils import require_jwt_for_spa


@require_GET
@require_jwt_for_spa("/coffee/login")
def get_reporting(request, path=None):
    """
    Serve the Coffee frontend SPA (companies_report.tsx).
    Requires valid JWT unless path is /coffee/login; otherwise redirects to /coffee/login.
    """
    return render(
        request,
        "reporting_dashboard.html",
        {
            "static_url": settings.STATIC_URL,
            "media_url": settings.MEDIA_URL,
            "csrf_token": get_token(request),
        },
    )
