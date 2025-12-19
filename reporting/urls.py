from django.urls import path, re_path
from .views import get_reporting


app_name = "reporting"

urlpatterns = [
    path("", get_reporting, name="reporting_dashboard"),
    re_path(
        r"^(?P<path>.*)$",
        get_reporting,
        name="reporting_dashboard_catch",
    ),
]
