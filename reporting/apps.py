from django.apps import AppConfig
from django.conf import settings


class ReportingConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "reporting"
    verbose_name = "Reporting"
