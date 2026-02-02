from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from myboost.permissions import AllowAuthenticatedOrValidShareToken
from reporting.core.params import filter_clients_by_customer_id_or_name
from reporting.core.sync import get_cached_sync_data
from shareable_report.signing_utils import get_share_customer_id_from_request


def _extract_devices_from_nested(node):
    """Extract device list from nested structure: { client: { site: { server|workstation: single or array } } }."""
    if not isinstance(node, dict):
        return []
    inner = (node.get("client") or {}).get("site")
    if not isinstance(inner, dict):
        return []
    out = []
    for key in ("server", "workstation"):
        arr = inner.get(key)
        if isinstance(arr, list):
            out.extend(arr)
        elif isinstance(arr, dict) and arr:
            out.append(arr)
    return out


def _flatten_devices(clients):
    devices = []
    for client in clients:
        dev = client.get("devices")
        if isinstance(dev, dict):
            for key in ("server", "workstation", "mobile_device"):
                items = dev.get(key)
                if isinstance(items, list):
                    devices.extend(items)
                elif isinstance(items, dict):
                    devices.extend(_extract_devices_from_nested(items))
                elif items:
                    devices.append(items)
        for site in (
            (client.get("sites") or [])
            if isinstance(client.get("sites"), list)
            else ([client.get("sites")] if client.get("sites") else [])
        ):
            if not site:
                continue
            for s in (
                (site.get("servers") or [])
                if isinstance(site.get("servers"), list)
                else []
            ):
                devices.append(s)
            for w in (
                (site.get("workstations") or [])
                if isinstance(site.get("workstations"), list)
                else []
            ):
                devices.append(w)
            for a in (
                (site.get("agentless_assets") or [])
                if isinstance(site.get("agentless_assets"), list)
                else []
            ):
                devices.append(a)
    return devices


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def list_devices(request):
    try:
        customer_filter = get_share_customer_id_from_request(
            request
        ) or request.GET.get("customerName")
        data = get_cached_sync_data()
        nablermm = data.get("nablermm") or {}
        clients = nablermm.get("clients") or []
        if isinstance(clients, dict):
            clients = []
        clients = filter_clients_by_customer_id_or_name(clients, customer_filter)
        devices = _flatten_devices(clients)
        return Response(devices)
    except Exception as e:
        print(e)
        return Response(
            {"error": f"An error occurred while fetching devices. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
