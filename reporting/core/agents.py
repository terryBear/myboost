from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from myboost.permissions import AllowAuthenticatedOrValidShareToken
from reporting.core.params import _norm
from reporting.core.sync import get_cached_sync_data
from shareable_report.signing_utils import get_share_customer_id_from_request


def _filter_agents_by_customer_name(agents, customer_name):
    if not customer_name or not _norm(customer_name):
        return agents
    want = _norm(customer_name)
    out = []
    for a in agents:
        if not isinstance(a, dict):
            continue
        site = _norm(a.get("siteName") or a.get("site") or "")
        if site == want:
            out.append(a)
    return out


@api_view(["GET"])
@permission_classes([AllowAuthenticatedOrValidShareToken])
def list_agents(request):
    try:
        customer_filter = get_share_customer_id_from_request(
            request
        ) or request.GET.get("customerName")
        data = get_cached_sync_data()
        sentinelone = data.get("sentinelone") or {}
        agents = sentinelone.get("list_agents")
        if agents is None:
            agents = []
        elif isinstance(agents, dict) and "data" in agents:
            agents = agents.get("data") or []
        elif not isinstance(agents, list):
            agents = [agents] if agents else []
        agents = _filter_agents_by_customer_name(agents, customer_filter)
        return Response(agents)
    except Exception as e:
        print(e)
        return Response(
            {"error": f"An error occurred while fetching agents. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
