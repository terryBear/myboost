from django.urls import path
from .views import share_view

app_name = "shareable_report"

urlpatterns = [
    path("<str:token>/", share_view, name="share_view"),
]
