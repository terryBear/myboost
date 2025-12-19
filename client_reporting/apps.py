from django.apps import AppConfig
from django.conf import settings


class ClientReportingConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "client_reporting"
    verbose_name = "Client Reporting"
