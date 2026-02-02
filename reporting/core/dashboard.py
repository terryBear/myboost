"""Dashboard/summary endpoint for reporting data."""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from reporting.core.sync import get_cached_sync_data


@api_view(["GET"])
def dashboard_summary(request):
    """Return a summary of reporting data for dashboard UI."""
    try:
        data = get_cached_sync_data()
        nablermm = data.get("nablermm") or {}
        sentinelone = data.get("sentinelone") or {}

        clients = nablermm.get("clients")
        if clients is None or isinstance(clients, dict):
            clients = []

        agents = sentinelone.get("list_agents")
        if isinstance(agents, dict) and "data" in agents:
            agents = agents.get("data") or []
        elif not isinstance(agents, list):
            agents = [agents] if agents else []

        summary = {
            "clients_count": len(clients),
            "agents_count": len(agents),
            "sentinelone": bool(sentinelone),
            "nablermm": bool(nablermm),
        }
        return Response(summary)
    except Exception as e:
        print(e)
        return Response(
            {"error": f"An error occurred while fetching dashboard. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
