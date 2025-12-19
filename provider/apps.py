from django.apps import AppConfig
from django.conf import settings


class ProviderConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "provider"
    verbose_name = "Provider"
