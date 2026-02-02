from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from myboost.permissions import AllowAuthenticatedOrValidShareToken
from reporting.core.params import filter_clients_by_customer_id_or_name
from reporting.core.sync import get_cached_sync_data
from shareable_report.signing_utils import get_share_customer_id_from_request


def _flatten_sites(clients):
    sites = []
    for client in clients:
        s = client.get("sites")
        if isinstance(s, list):
            sites.extend(s)
        elif isinstance(s, dict) and s:
            sites.append(s)
    return sites


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def list_sites(request):
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
        sites = _flatten_sites(clients)
        return Response(sites)
    except Exception as e:
        print(e)
        return Response(
            {"error": f"An error occurred while fetching sites. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
