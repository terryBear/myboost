"""
Normalize get_sync_data() response to provider -> clients structure (dummy.json shape),
then upsert into SyncProvider / SyncClient / SyncSite / SyncDevice / SyncFailingCheck.
No duplicate records; all data mapped back to a client.
"""

import logging
from datetime import datetime

from django.db import transaction

from reporting.models import (
    SyncProvider,
    SyncClient,
    SyncSite,
    SyncDevice,
    SyncFailingCheck,
    SyncRun,
    SyncDeviceCheck,
    SyncDeviceOutage,
    SyncDevicePerformanceHistory,
    SyncDeviceExchangeStorage,
    SyncDeviceHardware,
    SyncDeviceSoftware,
)
from reporting.core.sync import get_sync_data

logger = logging.getLogger(__name__)


def _parse_int(val):
    if val is None:
        return None
    if isinstance(val, int):
        return val
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


def _ensure_list(x):
    if x is None:
        return []
    return x if isinstance(x, list) else [x]


def _extract_sites(client_data):
    """Return list of site dicts from client['sites'] (single object or list)."""
    sites = client_data.get("sites")
    if sites is None:
        return []
    if isinstance(sites, list):
        return [s for s in sites if isinstance(s, dict)]
    return [sites] if isinstance(sites, dict) else []


def _extract_servers(site_data):
    """Return list of server dicts from site (servers can be object or list)."""
    servers = site_data.get("servers") or []
    return _ensure_list(servers) if isinstance(servers, (list, dict)) else []


def _extract_workstations(site_data):
    """Return list of workstation dicts from site."""
    workstations = site_data.get("workstations") or site_data.get("workstation") or []
    return _ensure_list(workstations) if isinstance(workstations, (list, dict)) else []


def _extract_failing_checks(client_data):
    """
    Extract failing check entries from client['failing_checks'].
    Structure: failing_checks.client.site (single). workstations.workstation (array or single).
    Each workstation can have: offline: { description, startdate, starttime }, failed_checks: { check: array or single }.
    Returns one entry per offline and one per failed check (check has checkid, description, date, time, etc.).
    """
    checks = []
    fc = client_data.get("failing_checks")
    if not fc or not isinstance(fc, dict):
        return checks
    try:
        client_node = fc.get("client")
        if not client_node or not isinstance(client_node, dict):
            return checks
        site_node = client_node.get("site")
        if site_node is None:
            return checks
        # site can be single dict (API response) or list
        sites = (
            [site_node]
            if isinstance(site_node, dict)
            else (_ensure_list(site_node) if isinstance(site_node, list) else [])
        )
        for s in sites:
            if not isinstance(s, dict):
                continue
            # workstations.workstation (array or single)
            ws_container = s.get("workstations") or s.get("workstation")
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
                # Offline entry
                offline = w.get("offline")
                if isinstance(offline, dict):
                    checks.append(
                        {
                            "device_id": device_id,
                            "device_name": device_name,
                            "description": str(offline.get("description", ""))[:5000],
                            "start_date": str(offline.get("startdate", "")),
                            "start_time": str(offline.get("starttime", "")),
                            "raw": w,
                        }
                    )
                # Failed checks (check can be single or array)
                failed = w.get("failed_checks")
                if isinstance(failed, dict):
                    for ch in _ensure_list(failed.get("check")):
                        if not isinstance(ch, dict):
                            continue
                        ch_date = str(ch.get("date", ""))
                        ch_time = str(ch.get("time", ""))
                        ch_id = ch.get("checkid", "")
                        # Uniqueness: use time + checkid when same device has multiple checks same time
                        start_time = f"{ch_time}_{ch_id}" if ch_id else ch_time
                        checks.append(
                            {
                                "device_id": device_id,
                                "device_name": device_name,
                                "description": str(ch.get("description", ""))[:5000],
                                "start_date": ch_date,
                                "start_time": start_time,
                                "raw": ch,
                            }
                        )
        # Same for servers if present
        for s in sites:
            if not isinstance(s, dict):
                continue
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
                offline = w.get("offline")
                if isinstance(offline, dict):
                    checks.append(
                        {
                            "device_id": device_id,
                            "device_name": device_name,
                            "description": str(offline.get("description", ""))[:5000],
                            "start_date": str(offline.get("startdate", "")),
                            "start_time": str(offline.get("starttime", "")),
                            "raw": w,
                        }
                    )
                overdue = w.get("overdue")
                if isinstance(overdue, dict):
                    checks.append(
                        {
                            "device_id": device_id,
                            "device_name": device_name,
                            "description": str(overdue.get("description", "Overdue"))[
                                :5000
                            ],
                            "start_date": str(overdue.get("startdate", "")),
                            "start_time": str(overdue.get("starttime", "")),
                            "raw": w,
                        }
                    )
                failed = w.get("failed_checks")
                if isinstance(failed, dict):
                    for ch in _ensure_list(failed.get("check")):
                        if not isinstance(ch, dict):
                            continue
                        ch_date = str(ch.get("date", ""))
                        ch_time = str(ch.get("time", ""))
                        ch_id = ch.get("checkid", "")
                        start_time = f"{ch_time}_{ch_id}" if ch_id else ch_time
                        checks.append(
                            {
                                "device_id": device_id,
                                "device_name": device_name,
                                "description": str(ch.get("description", ""))[:5000],
                                "start_date": ch_date,
                                "start_time": start_time,
                                "raw": ch,
                            }
                        )
    except Exception as e:
        logger.warning("Parsing failing_checks: %s", e)
    return checks


def _extract_devices_from_client(client_data):
    """
    Extract devices from client['devices'].
    API shape: devices.server / devices.workstation can be null or
    { client: { id, name, site: { id, siteid, name, server | workstation: single or array } } }.
    Returns list of (device_type, site_dict_or_None, raw_device).
    """
    devices = []
    dev = client_data.get("devices")
    if not isinstance(dev, dict):
        return devices
    for key, device_type in [
        ("server", "server"),
        ("workstation", "workstation"),
        ("mobile_device", "workstation"),
    ]:
        raw = dev.get(key)
        if raw is None:
            continue
        # Nested: { client: { site: { server | workstation: single or array } } }
        if isinstance(raw, dict):
            client_node = raw.get("client")
            if isinstance(client_node, dict):
                site_node = client_node.get("site")
                if isinstance(site_node, dict):
                    siteid = str(site_node.get("id") or site_node.get("siteid") or "")
                    site_name = str(site_node.get("name") or "")
                    site_dict = (
                        {"siteid": siteid, "name": site_name}
                        if (siteid or site_name)
                        else None
                    )
                    device_key = "server" if device_type == "server" else "workstation"
                    items = site_node.get(device_key)
                    for item in _ensure_list(items):
                        if isinstance(item, dict):
                            devices.append((device_type, site_dict, item))
                        else:
                            devices.append(
                                (
                                    device_type,
                                    site_dict,
                                    {"id": str(item), "name": "", "status": "unknown"},
                                )
                            )
                    continue
        # Fallback: flat list (legacy shape)
        for item in _ensure_list(raw):
            if isinstance(item, dict):
                devices.append((device_type, None, item))
            else:
                devices.append(
                    (
                        device_type,
                        None,
                        {"id": str(item), "name": "", "status": "unknown"},
                    )
                )
    return devices


def normalize_nablermm_to_provider_clients(nablermm_data):
    """
    Convert nablermm get_sync_data()['nablermm'] into { "provider_nablermm": { "clients": [...] } }
    Each client has sites (list), and we flatten sites/servers/workstations into a structure
    that can be upserted: client + sites + devices (per site) + failing_checks.
    """
    clients = nablermm_data.get("clients")
    if clients is None or isinstance(clients, dict):
        clients = []
    if not isinstance(clients, list):
        clients = [clients] if clients else []
    return {"provider_nablermm": {"clients": clients}}


def normalize_sync_data_to_provider_clients(sync_data):
    """
    Convert full get_sync_data() response into provider -> clients shape like dummy (1).json.
    nablermm: already has clients; use as provider_nablermm.
    sentinelone: optionally map list_agents to a single virtual client (e.g. provider_sentinelone) for storage.
    """
    out = {}
    nablermm = sync_data.get("nablermm")
    if nablermm and isinstance(nablermm, dict):
        out.update(normalize_nablermm_to_provider_clients(nablermm))
    # Optional: map sentinelone list_agents to a virtual client so all data is under a client
    sentinelone = sync_data.get("sentinelone")
    if sentinelone and isinstance(sentinelone, dict):
        agents = sentinelone.get("list_agents")
        if agents is not None:
            if isinstance(agents, dict) and "data" in agents:
                agents = agents.get("data") or []
            if not isinstance(agents, list):
                agents = [agents] if agents else []
            if agents:
                # Normalize agent dicts to same shape as devices (id, name, status, username)
                device_list = []
                for a in agents:
                    if isinstance(a, dict):
                        device_list.append(
                            {
                                "id": a.get("id") or a.get("uuid", ""),
                                "name": a.get("computerName") or a.get("name", ""),
                                "status": a.get("threatsStatus", "unknown")
                                or "unknown",
                                "username": a.get("domain", "") or "",
                            }
                        )
                    else:
                        device_list.append(
                            {
                                "id": str(a),
                                "name": "",
                                "status": "unknown",
                                "username": "",
                            }
                        )
                out["provider_sentinelone"] = {
                    "clients": [
                        {
                            "clientid": "s1-default",
                            "name": "SentinelOne Agents",
                            "creation_date": "",
                            "device_count": len(device_list),
                            "sites": [],
                            "devices": {
                                "server": [],
                                "workstation": device_list,
                                "mobile_device": [],
                            },
                            "failing_checks": {},
                        }
                    ]
                }
    return out


def upsert_sync_client(provider_slug, client_data):
    """Create or update SyncClient; return (SyncClient, list of site dicts, list of device tuples, list of check dicts)."""
    clientid = str(client_data.get("clientid", ""))
    name = str(client_data.get("name", "")) or clientid
    creation_date = str(client_data.get("creation_date", ""))[:50]
    device_count = client_data.get("device_count")
    if device_count is not None and not isinstance(device_count, int):
        try:
            device_count = int(device_count)
        except (TypeError, ValueError):
            device_count = None
    server_count = _parse_int(client_data.get("server_count"))
    workstation_count = _parse_int(client_data.get("workstation_count"))
    mobile_device_count = _parse_int(client_data.get("mobile_device_count"))
    timezone = str(client_data.get("timezone", ""))[:100]
    view_dashboard = str(client_data.get("view_dashboard", ""))[:20]
    view_wkstsn_assets = str(client_data.get("view_wkstsn_assets", ""))[:20]
    dashboard_username = str(client_data.get("dashboard_username", ""))[:255]

    provider, _ = SyncProvider.objects.get_or_create(
        slug=provider_slug,
        defaults={"name": provider_slug.replace("provider_", "").title()},
    )
    client, created = SyncClient.objects.update_or_create(
        provider=provider,
        clientid=clientid,
        defaults={
            "name": name,
            "creation_date": creation_date,
            "device_count": device_count,
            "server_count": server_count,
            "workstation_count": workstation_count,
            "mobile_device_count": mobile_device_count,
            "timezone": timezone,
            "view_dashboard": view_dashboard,
            "view_wkstsn_assets": view_wkstsn_assets,
            "dashboard_username": dashboard_username,
        },
    )
    sites = _extract_sites(client_data)
    devices_from_sites = []
    for site_data in sites:
        siteid = str(site_data.get("siteid", "")) or str(site_data.get("id", ""))
        site_name = str(site_data.get("name", "")) or siteid
        connection_ok = str(site_data.get("connection_ok", ""))[:20]
        site_creation_date = str(site_data.get("creation_date", ""))[:50]
        raw_data = {
            "agentless_assets": site_data.get("agentless_assets"),
            "primary_router": site_data.get("primary_router"),
            "secondary_router": site_data.get("secondary_router"),
        }
        SyncSite.objects.update_or_create(
            client=client,
            siteid=siteid,
            defaults={
                "name": site_name,
                "connection_ok": connection_ok,
                "creation_date": site_creation_date,
                "raw_data": raw_data,
            },
        )
        for s in _extract_servers(site_data):
            devices_from_sites.append(("server", site_data, s))
        for w in _extract_workstations(site_data):
            devices_from_sites.append(("workstation", site_data, w))
    # devices_standalone: list of (device_type, site_dict_or_None, raw_device)
    devices_standalone = _extract_devices_from_client(client_data)
    failing_checks = _extract_failing_checks(client_data)
    return client, sites, devices_from_sites, devices_standalone, failing_checks


def upsert_sync_device(client, site, device_type, raw_device):
    """Create or update SyncDevice; site can be None."""
    external_id = str(raw_device.get("id", raw_device.get("deviceid", "")) or "")
    name = str(
        raw_device.get("name", raw_device.get("device_name", ""))
        or external_id
        or "unknown"
    )
    status = str(raw_device.get("status", "unknown"))[:50]
    username = str(raw_device.get("username", ""))[:255]
    description = str(raw_device.get("description", ""))[:255]
    raw_data = {
        k: v
        for k, v in raw_device.items()
        if k
        not in (
            "id",
            "deviceid",
            "name",
            "device_name",
            "status",
            "username",
            "description",
        )
    }

    SyncDevice.objects.update_or_create(
        client=client,
        site=site,
        external_id=external_id,
        defaults={
            "name": name,
            "status": status,
            "username": username,
            "description": description,
            "device_type": device_type,
            "raw_data": raw_data or {},
        },
    )


def _upsert_device_extra(model_class, device_id, payload):
    """Find SyncDevice by external_id (provider_nablermm) and upsert model_class(device, payload)."""
    if payload is None:
        return
    device = SyncDevice.objects.filter(
        client__provider__slug="provider_nablermm",
        external_id=str(device_id),
    ).first()
    if not device:
        return
    payload_dict = payload if isinstance(payload, dict) else {"data": payload}
    try:
        model_class.objects.update_or_create(
            device=device,
            defaults={"payload": payload_dict},
        )
    except Exception as e:
        logger.warning(
            "_upsert_device_extra %s device %s: %s", model_class.__name__, device_id, e
        )


def upsert_sync_failing_check(
    client, device, description, start_date, start_time, raw_data=None
):
    """Create or update SyncFailingCheck; device can be None. Uses (client, device, start_date, start_time) for uniqueness."""
    start_date = (str(start_date) or "").strip()[:50]
    start_time = (str(start_time) or "").strip()[:50]
    # When both empty, use description hash so distinct checks don't overwrite
    if not start_date and not start_time:
        start_date = "__no_date__"
        start_time = (hash(description) % 10**10) if description else "0"
    SyncFailingCheck.objects.update_or_create(
        client=client,
        device=device,
        start_date=start_date,
        start_time=start_time,
        defaults={
            "description": (description or "")[:5000],
            "raw_data": raw_data or {},
        },
    )


def run_sync_and_store(sync_data=None):
    """
    Normalize sync response to provider -> clients, then upsert into
    SyncProvider / SyncClient / SyncSite / SyncDevice / SyncFailingCheck.
    If sync_data is None, call get_sync_data() to fetch it.
    Prevents duplicates via update_or_create and unique constraints.
    """
    logger.info("run_sync_and_store: starting")
    if sync_data is None:
        try:
            sync_data = get_sync_data()
        except Exception as e:
            logger.exception("get_sync_data failed: %s", e)
            raise
    if not isinstance(sync_data, dict):
        logger.warning("run_sync_and_store: sync_data is not a dict, skipping store")
        return
    SyncRun.objects.create(payload=sync_data)
    normalized = normalize_sync_data_to_provider_clients(sync_data)
    with transaction.atomic():
        for provider_slug, payload in normalized.items():
            clients = payload.get("clients") or []
            if not isinstance(clients, list):
                clients = [clients] if clients else []
            for client_data in clients:
                if not isinstance(client_data, dict):
                    continue
                try:
                    (
                        client,
                        sites,
                        devices_from_sites,
                        devices_standalone,
                        failing_checks,
                    ) = upsert_sync_client(provider_slug, client_data)
                except Exception as e:
                    logger.warning(
                        "upsert_sync_client %s %s: %s",
                        provider_slug,
                        client_data.get("clientid"),
                        e,
                    )
                    continue
                site_by_siteid = {s.siteid: s for s in client.sync_sites.all()}
                for device_type, site_data, raw in devices_from_sites:
                    siteid = str(site_data.get("siteid", "") or site_data.get("id", ""))
                    site = site_by_siteid.get(siteid)
                    try:
                        upsert_sync_device(client, site, device_type, raw)
                    except Exception as e:
                        logger.warning("upsert_sync_device: %s", e)
                for device_type, site_dict, raw in devices_standalone:
                    site = (
                        site_by_siteid.get(site_dict["siteid"]) if site_dict else None
                    )
                    try:
                        upsert_sync_device(client, site, device_type, raw)
                    except Exception as e:
                        logger.warning("upsert_sync_device (standalone): %s", e)
                device_by_external_id = {
                    (d.external_id, d.site_id): d for d in client.sync_devices.all()
                }
                for check in failing_checks:
                    dev_id = check.get("device_id")
                    dev_name = check.get("device_name")
                    device = None
                    for (eid, sid), d in device_by_external_id.items():
                        if eid == str(dev_id):
                            device = d
                            break
                    try:
                        upsert_sync_failing_check(
                            client,
                            device,
                            check.get("description", ""),
                            check.get("start_date", ""),
                            check.get("start_time", ""),
                            check.get("raw"),
                        )
                    except Exception as e:
                        logger.warning("upsert_sync_failing_check: %s", e)

        # Provider-level metadata (antivirus_products for nablermm)
        nablermm = sync_data.get("nablermm") or {}
        if (
            isinstance(nablermm, dict)
            and nablermm.get("antivirus_products") is not None
        ):
            try:
                provider = SyncProvider.objects.filter(slug="provider_nablermm").first()
                if provider:
                    provider.raw_metadata = {
                        "antivirus_products": nablermm.get("antivirus_products")
                    }
                    provider.save(update_fields=["raw_metadata"])
            except Exception as e:
                logger.warning("save antivirus_products to provider: %s", e)

        # Per-device data (checks, outages, performance, exchange, hardware, software)
        for device_id, payload in (nablermm.get("device_checks") or {}).items():
            _upsert_device_extra(SyncDeviceCheck, device_id, payload)
        for device_id, payload in (nablermm.get("device_outages") or {}).items():
            _upsert_device_extra(SyncDeviceOutage, device_id, payload)
        for device_id, payload in (
            nablermm.get("device_performance_history") or {}
        ).items():
            _upsert_device_extra(SyncDevicePerformanceHistory, device_id, payload)
        for device_id, payload in (
            nablermm.get("device_exchange_storage_history") or {}
        ).items():
            _upsert_device_extra(SyncDeviceExchangeStorage, device_id, payload)
        for device_id, payload in (nablermm.get("device_hardware") or {}).items():
            _upsert_device_extra(SyncDeviceHardware, device_id, payload)
        for device_id, payload in (nablermm.get("device_software") or {}).items():
            _upsert_device_extra(SyncDeviceSoftware, device_id, payload)

    logger.info("run_sync_and_store: finished")


def run_sync_and_store_every_5_minutes():
    """
    Entry point for a scheduler: run run_sync_and_store() every 5 minutes.
    Use from a management command that runs in a loop, or from cron every 5 mins.
    """
    import time

    interval_seconds = 5 * 60  # 5 minutes
    while True:
        try:
            run_sync_and_store()
        except Exception as e:
            logger.exception("run_sync_and_store failed: %s", e)
        time.sleep(interval_seconds)
