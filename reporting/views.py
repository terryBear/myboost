from django.views.generic import TemplateView
from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import get_token
from rest_framework.decorators import api_view


@api_view(["GET"])
def get_reporting(request, *args, **kwargs):
    """
    Render the reporting dashboard template.
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
