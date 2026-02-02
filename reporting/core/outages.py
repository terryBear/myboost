from rest_framework import status as http_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from myboost.permissions import AllowAuthenticatedOrValidShareToken
from reporting.core.params import filter_clients_by_customer_id_or_name
from reporting.core.sync import get_cached_sync_data
from shareable_report.signing_utils import get_share_customer_id_from_request


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def list_outages(request, status=None):  # status from URL path
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
        outages = []
        for client in clients:
            for site in (
                (client.get("sites") or [])
                if isinstance(client.get("sites"), list)
                else ([client.get("sites")] if client.get("sites") else [])
            ):
                if not site:
                    continue
                for device_type in ("servers", "workstations"):
                    for dev in (
                        (site.get(device_type) or [])
                        if isinstance(site.get(device_type), list)
                        else []
                    ):
                        out = dev.get("outages") if isinstance(dev, dict) else None
                        if isinstance(out, list):
                            outages.extend(out)
                        elif out:
                            outages.append(out)
        # Merge in per-device outages from sync payload
        device_outages_map = nablermm.get("device_outages") or {}
        if isinstance(device_outages_map, dict):
            for device_id, payload in device_outages_map.items():
                if payload is None:
                    continue
                items = (
                    payload.get("result", {}).get("items", payload)
                    if isinstance(payload, dict)
                    else payload
                )
                if isinstance(items, list):
                    for o in items:
                        if isinstance(o, dict):
                            outages.append({**o, "device_id": device_id})
                elif isinstance(items, dict) and items:
                    outages.append({**items, "device_id": device_id})
        status_filter = status
        if status_filter:
            outages = [
                o
                for o in outages
                if isinstance(o, dict) and o.get("status") == status_filter
            ]
        return Response(outages)
    except Exception as e:
        print(e)
        return Response(
            {"error": f"An error occurred while fetching outages. {str(e)}"},
            status=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
