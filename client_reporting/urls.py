from django.urls import path, re_path
from .views import get_client_report

app_name = "client_reporting"

urlpatterns = [
    path(
        "",
        get_client_report,
        name="client_report",
    ),
    re_path(
        r"^(?P<path>.*)$",
        get_client_report,
        name="client_reporting_dashboard_catch",
    ),
]
