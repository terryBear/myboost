"""
APIs for device-scoped data (checks, outages, performance, exchange, hardware, software)
and supported antivirus products / agentless assets by site.
All return from cached sync payload (same source as list_clients, list_devices, etc.).
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from myboost.permissions import AllowAuthenticatedOrValidShareToken
from reporting.core.params import filter_clients_by_customer_id_or_name
from reporting.core.sync import get_cached_sync_data
from shareable_report.signing_utils import get_share_customer_id_from_request


def _get_nablermm_filtered(request):
    data = get_cached_sync_data()
    nablermm = data.get("nablermm") or {}
    clients = nablermm.get("clients") or []
    if isinstance(clients, dict):
        clients = []
    customer_filter = get_share_customer_id_from_request(request) or request.GET.get(
        "customerName"
    )
    clients = filter_clients_by_customer_id_or_name(clients, customer_filter)
    return nablermm, clients


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def antivirus_products(request):
    """Supported antivirus products (from nablermm.antivirus_products)."""
    try:
        data = get_cached_sync_data()
        nablermm = data.get("nablermm") or {}
        payload = nablermm.get("antivirus_products")
        return Response(payload if payload is not None else {})
    except Exception as e:
        return Response(
            {"error": f"An error occurred while fetching antivirus products. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def device_checks(request, device_id):
    """Checks by device."""
    try:
        _, _ = _get_nablermm_filtered(request)
        data = get_cached_sync_data()
        nablermm = data.get("nablermm") or {}
        payload = (nablermm.get("device_checks") or {}).get(str(device_id))
        return Response(payload if payload is not None else {})
    except Exception as e:
        return Response(
            {"error": f"An error occurred while fetching checks for device. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def device_outages(request, device_id):
    """Outages by device."""
    try:
        data = get_cached_sync_data()
        nablermm = data.get("nablermm") or {}
        payload = (nablermm.get("device_outages") or {}).get(str(device_id))
        return Response(payload if payload is not None else {})
    except Exception as e:
        return Response(
            {"error": f"An error occurred while fetching outages for device. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def device_performance_history(request, device_id):
    """Performance history by device."""
    try:
        data = get_cached_sync_data()
        nablermm = data.get("nablermm") or {}
        payload = (nablermm.get("device_performance_history") or {}).get(str(device_id))
        return Response(payload if payload is not None else {})
    except Exception as e:
        return Response(
            {
                "error": f"An error occurred while fetching performance history. {str(e)}"
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def device_exchange_storage(request, device_id):
    """Exchange storage history by device."""
    try:
        data = get_cached_sync_data()
        nablermm = data.get("nablermm") or {}
        payload = (nablermm.get("device_exchange_storage_history") or {}).get(
            str(device_id)
        )
        return Response(payload if payload is not None else {})
    except Exception as e:
        return Response(
            {"error": f"An error occurred while fetching exchange storage. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def device_hardware(request, device_id):
    """Hardware by asset (device)."""
    try:
        data = get_cached_sync_data()
        nablermm = data.get("nablermm") or {}
        payload = (nablermm.get("device_hardware") or {}).get(str(device_id))
        return Response(payload if payload is not None else {})
    except Exception as e:
        return Response(
            {"error": f"An error occurred while fetching hardware. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def device_software(request, device_id):
    """Software by asset (device)."""
    try:
        data = get_cached_sync_data()
        nablermm = data.get("nablermm") or {}
        payload = (nablermm.get("device_software") or {}).get(str(device_id))
        return Response(payload if payload is not None else {})
    except Exception as e:
        return Response(
            {"error": f"An error occurred while fetching software. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def _flatten_sites_with_id(clients):
    sites = []
    for client in clients:
        s = client.get("sites")
        for site in (
            s if isinstance(s, list) else [s] if isinstance(s, dict) and s else []
        ):
            if isinstance(site, dict) and site.get("siteid"):
                sites.append(site)
    return sites


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def site_agentless_assets(request, site_id):
    """Agentless assets by site."""
    try:
        _, clients = _get_nablermm_filtered(request)
        sites = _flatten_sites_with_id(clients)
        for site in sites:
            if str(site.get("siteid")) == str(site_id):
                assets = site.get("agentless_assets")
                return Response(
                    assets
                    if isinstance(assets, list)
                    else ([] if assets is None else [assets])
                )
        return Response([])
    except Exception as e:
        return Response(
            {"error": f"An error occurred while fetching agentless assets. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
