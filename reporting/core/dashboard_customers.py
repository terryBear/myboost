"""
Dashboard customers endpoint: returns a list of customers in the shape expected by
the Coffee dashboard UI (id, name, healthScore, devices, patchCompliance, etc.),
built from get_cached_sync_data() (nablermm clients + sentinelone).

Supports:
- share_token: query param or X-Share-Token header; when valid, returns only that customer (no JWT required).
- Authenticated user with UserCustomerProfile.customer_id: returns only that customer.

Caching: full "all customers" list is cached (Redis/locmem) and invalidated when sync runs.
"""

from datetime import datetime

from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from reporting.core.sync import get_cached_sync_data, DASHBOARD_CUSTOMERS_CACHE_KEY

# TTL for the full customers list (invalidated on reporting sync).
DASHBOARD_CUSTOMERS_CACHE_TIMEOUT = 300  # 5 minutes, align with reporting sync cache


def _ensure_list(x):
    if x is None:
        return []
    return x if isinstance(x, list) else [x]


def _count_devices(client_data):
    """Count devices from client sites (servers + workstations) and client.devices."""
    count = 0
    sites = client_data.get("sites")
    if isinstance(sites, list):
        for s in sites:
            if not isinstance(s, dict):
                continue
            for key in ("servers", "workstations"):
                items = s.get(key)
                if isinstance(items, list):
                    count += len(items)
                elif isinstance(items, dict):
                    count += 1
    elif isinstance(sites, dict):
        for key in ("servers", "workstations"):
            items = sites.get(key)
            if isinstance(items, list):
                count += len(items)
            elif isinstance(items, dict):
                count += 1
    dev = client_data.get("devices")
    if isinstance(dev, dict):
        for key in ("server", "workstation", "mobile_device"):
            items = dev.get(key)
            if isinstance(items, list):
                count += len(items)
            elif items:
                count += 1
    return count or client_data.get("device_count") or 0


def _failing_checks_count(client_data):
    """Return number of failing checks for this client."""
    fc = client_data.get("failing_checks")
    if isinstance(fc, list):
        return len(fc)
    if isinstance(fc, dict):
        return 1
    return 0


def _build_customers_from_sync(data):
    """Build list of customer dicts for dashboard UI from get_cached_sync_data()."""
    customers = []
    nablermm = data.get("nablermm") or {}
    sentinelone = data.get("sentinelone") or {}
    clients = nablermm.get("clients")
    if clients is None or isinstance(clients, dict):
        clients = []
    if not isinstance(clients, list):
        clients = [clients] if clients else []

    # SentinelOne: aggregate threats (optional - we may not have per-client mapping)
    threats_count = 0
    agents_list = sentinelone.get("list_agents")
    if isinstance(agents_list, dict) and "data" in agents_list:
        agents_list = agents_list.get("data") or []
    elif not isinstance(agents_list, list):
        agents_list = []
    threats_data = sentinelone.get("list_threats")
    if isinstance(threats_data, dict) and "data" in threats_data:
        threats_count = len(threats_data.get("data") or [])
    elif isinstance(threats_data, list):
        threats_count = len(threats_data)

    for client in clients:
        if not isinstance(client, dict):
            continue
        clientid = str(client.get("clientid", ""))
        name = str(client.get("name", "") or clientid or "Unknown")
        devices = _count_devices(client)
        patching_issues = _failing_checks_count(client)
        # Patch compliance: assume 100 - (issues * 10) capped, or 100 if no issues
        patch_compliance = (
            100 - min(100, patching_issues * 10) if patching_issues else 100
        )
        # Security: use SentinelOne threat count (global; no per-client mapping in sync)
        security_score = max(0, 100 - threats_count * 5) if threats_count else 100
        critical_threats = (
            threats_count // max(1, len(clients)) if clients else threats_count
        )
        health_score = (patch_compliance + security_score) // 2

        customers.append(
            {
                "id": clientid or name,
                "name": name,
                "healthScore": health_score,
                "devices": devices,
                "patchCompliance": patch_compliance,
                "securityScore": security_score,
                "backupStatus": "N/A",
                "securityStatus": "Protected" if critical_threats == 0 else "At Risk",
                "networkUptime": 98.5,
                "lastUpdated": datetime.utcnow().strftime("%Y-%m-%d"),
                "criticalThreats": critical_threats,
                "patchingIssues": patching_issues,
            }
        )

    # If we have SentinelOne agents but no nablermm clients, add one virtual customer
    if not customers and agents_list:
        customers.append(
            {
                "id": "sentinelone",
                "name": "SentinelOne Agents",
                "healthScore": 100 - min(100, threats_count * 5),
                "devices": len(agents_list),
                "patchCompliance": 0,
                "securityScore": max(0, 100 - threats_count * 5),
                "backupStatus": "N/A",
                "securityStatus": "Protected" if threats_count == 0 else "At Risk",
                "networkUptime": 98.5,
                "lastUpdated": datetime.utcnow().strftime("%Y-%m-%d"),
                "criticalThreats": threats_count,
                "patchingIssues": 0,
            }
        )

    return customers


def _scope_customers_to_id(customers, customer_id):
    """Filter customers list to a single id (or name). Returns list of 0 or 1 item."""
    if not customer_id:
        return customers
    want = str(customer_id).strip()
    for c in customers:
        if (
            str(c.get("id") or "").strip() == want
            or str(c.get("name") or "").strip() == want
        ):
            return [c]
    return []


def _get_all_customers_cached():
    """Return full list of customers, from cache if present else build and cache."""
    customers = cache.get(DASHBOARD_CUSTOMERS_CACHE_KEY)
    if customers is not None:
        return customers
    data = get_cached_sync_data()
    customers = _build_customers_from_sync(data)
    cache.set(
        DASHBOARD_CUSTOMERS_CACHE_KEY,
        customers,
        DASHBOARD_CUSTOMERS_CACHE_TIMEOUT,
    )
    return customers


@api_view(["GET"])
@permission_classes([AllowAny])
def dashboard_customers(request):
    """
    Return customer list for Coffee dashboard.
    - If share_token (query or X-Share-Token) is valid: return only that customer (no auth required).
    - If user is authenticated and has UserCustomerProfile.customer_id: return only that customer.
    - Otherwise return all customers (requires auth via default DRF; we allow any and enforce below).
    Full "all customers" list is cached; cache is invalidated when reporting sync runs.
    """
    try:
        # Share link: no JWT required
        share_token = (
            request.query_params.get("share_token")
            or request.META.get("HTTP_X_SHARE_TOKEN")
            or ""
        ).strip()
        if share_token:
            from shareable_report.signing_utils import verify_share_token

            payload = verify_share_token(share_token)
            if payload:
                customers = _get_all_customers_cached()
                scoped = _scope_customers_to_id(customers, payload["customer_id"])
                return Response(scoped)
            return Response(
                {"error": "Invalid or expired share link."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Authenticated: optionally scope by user's linked customer
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        customer_id = None
        try:
            profile = getattr(request.user, "reporting_userprofile", None)
            if profile and getattr(profile, "customer_id", None):
                customer_id = profile.customer_id
        except Exception:
            pass
        customers = _get_all_customers_cached()
        if customer_id:
            customers = _scope_customers_to_id(customers, customer_id)
        return Response(customers)
    except Exception as e:
        print(e)
        return Response(
            {
                "error": f"An error occurred while fetching dashboard customers. {str(e)}"
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
