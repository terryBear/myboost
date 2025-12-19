from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from django.views.generic import TemplateView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from reporting.core.sync import sync_data
from reporting.core.clients import list_clients
from reporting.core.agents import list_agents
from reporting.core.access import list_access
from reporting.core.devices import list_devices
from reporting.core.sites import list_sites
from reporting.core.servers import list_servers
from reporting.core.workstations import list_workstations
from reporting.core.checks import list_checks
from reporting.core.outages import list_outages

schema_view = get_schema_view(
    openapi.Info(
        title="MyBoost Reporter API",
        default_version="v1",
        description="API documentation",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = (
    [
        path("admin/", admin.site.urls),
        path("api/provider/", include("provider.urls")),
        path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
        path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
        path("api/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
        path("api/reporting/sync/", sync_data, name="reporting_dashboard"),
        path("api/reporting/clients/", list_clients, name="list_clients"),
        path("api/reporting/agents/", list_agents, name="list_agents"),
        path("api/reporting/sites/", list_sites, name="list_sites"),
        path("api/reporting/servers/", list_servers, name="list_servers"),
        path(
            "api/reporting/workstations/", list_workstations, name="list_workstations"
        ),
        path("api/reporting/agentless-access/", list_access, name="list_access"),
        path("api/reporting/devices/", list_devices, name="list_devices"),
        path("api/reporting/devices/monitoring/", list_devices, name="list_devices"),
        path(
            "api/reporting/devices/performance-history/",
            list_devices,
            name="list_devices",
        ),
        path("api/reporting/checks/", list_checks, name="list_checks"),
        path(
            "api/reporting/checks/<str:status>/",
            list_checks,
            name="list_checks_by_status",
        ),
        path(
            "api/reporting/outages/<str:status>/",
            list_outages,
            name="list_outages_by_status",
        ),
        path(
            "swagger/",
            schema_view.with_ui("swagger", cache_timeout=0),
            name="schema-swagger-ui",
        ),
        path(
            "redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"
        ),
        path(
            "boostcoffee/",
            include("client_reporting.urls"),
            name="client_reporting_index",
        ),
        path(
            "coffee/",
            include("reporting.urls"),
            name="reporting_index",
        ),
    ]
    + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
)
