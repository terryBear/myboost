"""Query param helpers for reporting API (e.g. customerName filter)."""


def _norm(name):
    if name is None:
        return ""
    return str(name).strip().lower()


def filter_clients_by_customer_name(clients, customer_name):
    """Return clients whose name matches customer_name (case-insensitive). Empty name = all clients."""
    if not client_list_ok(clients):
        return []
    if not (customer_name and _norm(customer_name)):
        return clients
    want = _norm(customer_name)
    return [c for c in clients if _norm(c.get("name")) == want]


def filter_clients_by_customer_id_or_name(clients, id_or_name):
    """Return clients whose clientid or name matches id_or_name (case-insensitive). Empty = all clients."""
    if not client_list_ok(clients):
        return []
    if not (id_or_name and _norm(id_or_name)):
        return clients
    want = _norm(id_or_name)
    return [
        c
        for c in clients
        if _norm(c.get("name")) == want or _norm(str(c.get("clientid") or "")) == want
    ]


def client_list_ok(clients):
    if clients is None:
        return False
    if isinstance(clients, dict):
        return False
    return isinstance(clients, list)
