from django.urls import include, path
from .views import list_providers

app_name = "provider"


urlpatterns = [
    path("", list_providers, name="list_providers"),
]
