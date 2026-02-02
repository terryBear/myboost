"""
Fault report / Contact us: store submission and email all staff users.
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from reporting.models import FaultReport

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def fault_report(request: Request) -> Response:
    """Accept fault report, save to DB, email all staff users."""
    name = request.data.get("name", "").strip()
    email = request.data.get("email", "").strip()
    subject = request.data.get("subject", "").strip()
    message = request.data.get("message", "").strip()

    if not name or not email or not subject or not message:
        return Response(
            {"error": "name, email, subject and message are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    report = FaultReport.objects.create(
        name=name,
        email=email,
        subject=subject,
        message=message,
    )

    admin_emails = list(
        User.objects.filter(is_staff=True).exclude(email="").values_list("email", flat=True)
    )
    if admin_emails:
        body = f"""A fault report was submitted from the MyBoost report app.

From: {report.name} <{report.email}>
Subject: {report.subject}

Message:
{report.message}

---
Submitted at: {report.created_at.isoformat()}
"""
        from_email = getattr(
            settings, "DEFAULT_FROM_EMAIL", "noreply@myboost.co.za"
        )
        send_mail(
            subject=f"[MyBoost Fault Report] {report.subject}",
            message=body,
            from_email=from_email,
            recipient_list=admin_emails,
            fail_silently=True,
        )

    return Response({"id": str(report.pk), "status": "ok"}, status=status.HTTP_201_CREATED)
