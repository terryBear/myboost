from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from myboost.permissions import AllowAuthenticatedOrValidShareToken
from reporting.core.params import filter_clients_by_customer_id_or_name
from reporting.core.sync import get_cached_sync_data
from shareable_report.signing_utils import get_share_customer_id_from_request


def _ensure_list(x):
    if x is None:
        return []
    return x if isinstance(x, list) else [x]


def _flatten_checks(clients):
    """Flatten failing_checks to a list of check items (offline + failed_checks.check per device)."""
    checks = []
    for client in clients:
        fc = client.get("failing_checks")
        if not fc or not isinstance(fc, dict):
            continue
        client_node = fc.get("client")
        if not client_node or not isinstance(client_node, dict):
            continue
        site_node = client_node.get("site")
        if site_node is None:
            continue
        sites = [site_node] if isinstance(site_node, dict) else _ensure_list(site_node)
        for s in sites:
            if not isinstance(s, dict):
                continue
            for ws_container_key in ("workstations", "workstation"):
                ws_container = s.get(ws_container_key)
                if ws_container is None:
                    continue
                ws_list = (
                    ws_container.get("workstation")
                    if isinstance(ws_container, dict)
                    else ws_container
                )
                for w in _ensure_list(ws_list):
                    if not isinstance(w, dict):
                        continue
                    device_id = w.get("id")
                    device_name = w.get("name", "")
                    if isinstance(w.get("offline"), dict):
                        o = w["offline"]
                        checks.append(
                            {
                                "device_id": device_id,
                                "device_name": device_name,
                                "description": o.get("description", ""),
                                "start_date": o.get("startdate", ""),
                                "start_time": o.get("starttime", ""),
                                "raw": w,
                            }
                        )
                    failed = w.get("failed_checks")
                    if isinstance(failed, dict):
                        for ch in _ensure_list(failed.get("check")):
                            if isinstance(ch, dict):
                                checks.append(
                                    {
                                        "device_id": device_id,
                                        "device_name": device_name,
                                        "description": ch.get("description", ""),
                                        "start_date": ch.get("date", ""),
                                        "start_time": ch.get("time", ""),
                                        "checkid": ch.get("checkid"),
                                        "raw": ch,
                                    }
                                )
            srv_container = s.get("servers")
            if srv_container is None:
                continue
            srv_list = (
                srv_container.get("server")
                if isinstance(srv_container, dict)
                else srv_container
            )
            for w in _ensure_list(srv_list):
                if not isinstance(w, dict):
                    continue
                device_id = w.get("id")
                device_name = w.get("name", "")
                if isinstance(w.get("offline"), dict):
                    o = w["offline"]
                    checks.append(
                        {
                            "device_id": device_id,
                            "device_name": device_name,
                            "description": o.get("description", ""),
                            "start_date": o.get("startdate", ""),
                            "start_time": o.get("starttime", ""),
                            "raw": w,
                        }
                    )
                if isinstance(w.get("overdue"), dict):
                    o = w["overdue"]
                    checks.append(
                        {
                            "device_id": device_id,
                            "device_name": device_name,
                            "description": o.get("description", "Overdue"),
                            "start_date": o.get("startdate", ""),
                            "start_time": o.get("starttime", ""),
                            "raw": w,
                        }
                    )
                failed = w.get("failed_checks")
                if isinstance(failed, dict):
                    for ch in _ensure_list(failed.get("check")):
                        if isinstance(ch, dict):
                            checks.append(
                                {
                                    "device_id": device_id,
                                    "device_name": device_name,
                                    "description": ch.get("description", ""),
                                    "start_date": ch.get("date", ""),
                                    "start_time": ch.get("time", ""),
                                    "checkid": ch.get("checkid"),
                                    "raw": ch,
                                }
                            )
    return checks


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def list_checks(request):
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
        checks = _flatten_checks(clients)
        return Response(checks)
    except Exception as e:
        print(e)
        return Response(
            {"error": f"An error occurred while fetching checks. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
