from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from myboost.permissions import IsAdminUser

import requests
import xmltodict

REPORTING_CACHE_KEY = "reporting_sync_data"
REPORTING_CACHE_TIMEOUT = 300  # 5 minutes
# Key for dashboard customers list; invalidate when sync runs so /customers/all gets fresh data.
DASHBOARD_CUSTOMERS_CACHE_KEY = "dashboard_customers:all"


def clean_response(data):
    try:
        response = None
        if data.headers.get("Content-Type") == "application/json":
            response = data.json()
        else:
            response = xmltodict.parse(data.content)
        return response
    except Exception as e:
        response = {"error": str(e)}
        return response


def get_sentinel_one_data():

    url = "https://euce1-swprd6.sentinelone.net/web/api/v2.1"
    apikey = "eyJraWQiOiJldS1jZW50cmFsLTEtcHJvZC0wIiwiYWxnIjoiRVMyNTYifQ.eyJzdWIiOiJtaWNoYWVsQG15Ym9vc3QuY28uemEiLCJpc3MiOiJhdXRobi1ldS1jZW50cmFsLTEtcHJvZCIsImRlcGxveW1lbnRfaWQiOiIxNDU4MCIsInR5cGUiOiJ1c2VyIiwiZXhwIjoxNzY2MDc5MzgwLCJpYXQiOjE3NjM0ODczODAsImp0aSI6ImFhNTlhYjlmLWY5OTctNDY0OC04MjBjLWRhZmI4ZGQ1YjA3MSJ9.vTrBHNBgbHCeVmLzqGaYaQ54hrscwW3RYZV49Zp-DJxmTNmom80Tu1iEMeymUtjNGO2CTl4Vt-c7Wl1iD76cuw"
    res = {}

    def list_threats():
        try:

            response = requests.get(
                f"{url}/threats?limit=1000&sortBy=createdAt&sortOrder=desc",
                headers={
                    "Authorization": f"ApiToken {apikey}",
                },
            )
            return response.json()
        except Exception as e:
            res["list_threats"] = {"error": str(e)}
            return

    def list_agents():
        try:

            response = requests.get(
                f"{url}/agents?limit=1000&sortBy=createdAt&sortOrder=desc",
                headers={
                    "Authorization": f"ApiToken {apikey}",
                },
            )
            return response.json()
        except Exception as e:
            res["list_agents"] = {"error": str(e)}
            return

    def init():
        res["list_threats"] = list_threats()
        res["list_agents"] = list_agents()
        return res

    return init()


def get_nablermm_data():

    url = "https://wwweurope1.systemmonitor.eu.com/api"
    apikey = "5c073162c978d9c523e22fb2270a3a38"
    res = {}

    def list_failing_checks_by_client(client_id):
        try:
            connectionstring = f"{url}/?apikey={apikey}&service=list_failing_checks&clientid={client_id}&check_type=random"
            response = requests.get(
                connectionstring,
            )
            data = clean_response(response)["result"]["items"]
            return data
        except Exception as e:
            res["list_failing_checks_by_client"][client_id] = {"error": str(e)}
            return

    def list_check_by_device(device_id):
        try:
            connectionstring = (
                f"{url}/?apikey={apikey}&service=list_checks&deviceid={device_id}"
            )
            response = requests.get(
                connectionstring,
            )
            data = clean_response(response)
            return data
        except Exception as e:
            res["list_check_by_device"][device_id] = {"error": str(e)}
            return

    def list_outages_by_device(device_id):
        try:
            connectionstring = (
                f"{url}/?apikey={apikey}&service=list_outages&deviceid={device_id}"
            )
            response = requests.get(
                connectionstring,
            )
            data = clean_response(response)
            return data
        except Exception as e:
            res["list_outages_by_device"][device_id] = {"error": str(e)}
            return

    def list_performance_history_by_device(device_id):
        try:
            connectionstring = f"{url}/?apikey={apikey}&service=list_performance_history&deviceid={device_id}"
            response = requests.get(
                connectionstring,
            )
            data = clean_response(response)
            return data
        except Exception as e:
            res["list_performance_history_by_device"][device_id] = {"error": str(e)}
            return

    def list_exchange_storage_history_by_device(device_id):
        try:
            connectionstring = f"{url}/?apikey={apikey}&service=list_exchange_storage_history&deviceid={device_id}"
            response = requests.get(
                connectionstring,
            )
            data = clean_response(response)
            return data
        except Exception as e:
            res["list_exchange_storage_history_by_device"][device_id] = {
                "error": str(e)
            }
            return

    def list_supported_antivirus_products():
        try:
            connectionstring = (
                f"{url}/?apikey={apikey}&service=list_supported_av_products"
            )
            response = requests.get(
                connectionstring,
            )
            data = clean_response(response)
            return data
        except Exception as e:
            res["list_supported_antivirus_products"] = {"error": str(e)}
            return

    def list_hardware_by_asset(asset_id):
        try:
            connectionstring = (
                f"{url}/?apikey={apikey}&service=list_all_hardware&assetid={asset_id}"
            )
            response = requests.get(
                connectionstring,
            )
            data = clean_response(response)
            return data
        except Exception as e:
            res["list_all_hardware"][asset_id] = {"error": str(e)}
            return

    def list_software_by_asset(asset_id):
        try:
            connectionstring = (
                f"{url}/?apikey={apikey}&service=list_all_software&assetid={asset_id}"
            )
            response = requests.get(
                connectionstring,
            )
            data = clean_response(response)
            return data
        except Exception as e:
            res["list_all_software"][asset_id] = {"error": str(e)}
            return

    def get_agentless_assets_per_site(site_id):
        try:
            connectionstring = (
                f"{url}/?apikey={apikey}&service=list_agentless_assets&siteid={site_id}"
            )
            response = requests.get(
                connectionstring,
            )
            agentless_assets = clean_response(response)
            return agentless_assets
        except Exception as e:
            res["agentless_assets"] = {"error": str(e)}
            return

    def get_workstations_per_site(site_id):
        try:
            connectionstring = (
                f"{url}/?apikey={apikey}&service=list_workstations&siteid={site_id}"
            )
            response = requests.get(
                connectionstring,
            )
            workstations = clean_response(response)
            return workstations
        except Exception as e:
            res["servers"] = {"error": str(e)}

    def get_servers_per_site(site_id):
        try:
            connectionstring = (
                f"{url}/?apikey={apikey}&service=list_servers&siteid={site_id}"
            )
            response = requests.get(
                connectionstring,
            )
            servers = clean_response(response)
            return servers
        except Exception as e:
            res["servers"] = {"error": str(e)}
            return

    def get_devices_per_client(client_id):
        try:
            connectionstring1 = f"{url}/?apikey={apikey}&service=list_devices_at_client&clientid={client_id}&devicetype=server"
            connectionstring2 = f"{url}/?apikey={apikey}&service=list_devices_at_client&clientid={client_id}&devicetype=workstation"
            connectionstring3 = f"{url}/?apikey={apikey}&service=list_devices_at_client&clientid={client_id}&devicetype=mobile_device"

            devices = {
                "server": clean_response(
                    requests.get(
                        connectionstring1,
                    ),
                )[
                    "result"
                ]["items"],
                "workstation": clean_response(
                    requests.get(
                        connectionstring2,
                    ),
                )[
                    "result"
                ]["items"],
                "mobile_device": clean_response(
                    requests.get(
                        connectionstring3,
                    ),
                )[
                    "result"
                ]["items"],
            }

            return devices
        except Exception as e:
            res["sites"] = {"error": str(e)}
            return

    def get_sites_per_client(client_id):
        try:
            connectionstring = (
                f"{url}/?apikey={apikey}&service=list_sites&clientid={client_id}"
            )
            response = requests.get(
                connectionstring,
            )
            sites = clean_response(response)["result"]["items"]["site"]
            return sites
        except Exception as e:
            res["sites"] = {"error": str(e)}
            return

    def get_clients():
        try:
            response = requests.get(
                f"{url}/?apikey={apikey}&service=list_clients",
            )
            clients = clean_response(response)["result"]["items"]["client"]
            antivirus_products = list_supported_antivirus_products()

            for client in clients:
                site = get_sites_per_client(client["clientid"])
                devices = get_devices_per_client(client["clientid"])
                checks = list_failing_checks_by_client(client["clientid"])

                servers = []
                workstations = []
                agentless_assets = []

                if isinstance(site, dict):
                    if "siteid" in site:
                        # Get servers per site
                        serverresponse = get_servers_per_site(site["siteid"])
                        if isinstance(serverresponse, dict):
                            items = serverresponse.get("result", {}).get("items") or {}
                            if isinstance(items, dict) and "server" in items:
                                srv = items["server"]
                                servers = (
                                    srv
                                    if isinstance(srv, list)
                                    else [srv] if srv else []
                                )

                        # Get workstations per site
                        workstationresponse = get_workstations_per_site(site["siteid"])
                        if isinstance(workstationresponse, dict):
                            items = (
                                workstationresponse.get("result", {}).get("items") or {}
                            )
                            if isinstance(items, dict) and "workstation" in items:
                                wk = items["workstation"]
                                workstations = (
                                    wk if isinstance(wk, list) else [wk] if wk else []
                                )

                        # Get agentless assets per site
                        agentlessresponse = get_agentless_assets_per_site(
                            site["siteid"]
                        )
                        if isinstance(agentlessresponse, dict):
                            items = (
                                agentlessresponse.get("result", {}).get("items") or {}
                            )
                            if isinstance(items, dict) and "agentless_asset" in items:
                                aa = items["agentless_asset"]
                                agentless_assets = (
                                    aa if isinstance(aa, list) else [aa] if aa else []
                                )

                elif isinstance(site, list):
                    for s in site:
                        if "siteid" in s:
                            serverresponse = get_servers_per_site(s["siteid"])
                            if isinstance(serverresponse, dict):
                                items = (
                                    serverresponse.get("result", {}).get("items") or {}
                                )
                                if isinstance(items, dict) and "server" in items:
                                    srv = items["server"]
                                    servers.extend(
                                        srv
                                        if isinstance(srv, list)
                                        else [srv] if srv else []
                                    )

                            workstationresponse = get_workstations_per_site(s["siteid"])
                            if isinstance(workstationresponse, dict):
                                items = (
                                    workstationresponse.get("result", {}).get("items")
                                    or {}
                                )
                                if isinstance(items, dict) and "workstation" in items:
                                    wk = items["workstation"]
                                    workstations.extend(
                                        wk
                                        if isinstance(wk, list)
                                        else [wk] if wk else []
                                    )

                            agentlessresponse = get_agentless_assets_per_site(
                                s["siteid"]
                            )
                            if isinstance(agentlessresponse, dict):
                                items = (
                                    agentlessresponse.get("result", {}).get("items")
                                    or {}
                                )
                                if (
                                    isinstance(items, dict)
                                    and "agentless_asset" in items
                                ):
                                    aa = items["agentless_asset"]
                                    agentless_assets.extend(
                                        aa
                                        if isinstance(aa, list)
                                        else [aa] if aa else []
                                    )

                site["servers"] = servers
                site["workstations"] = workstations
                site["agentless_assets"] = agentless_assets

                client["sites"] = site
                client["devices"] = devices
                client["failing_checks"] = checks

            # Collect device IDs for per-device data (checks, outages, performance, etc.)
            device_ids = set()
            for client in clients:
                if not isinstance(client, dict):
                    continue
                for site in (
                    (client.get("sites") or [])
                    if isinstance(client.get("sites"), list)
                    else ([client.get("sites")] if client.get("sites") else [])
                ):
                    if not isinstance(site, dict):
                        continue
                    for key in ("servers", "workstations", "server", "workstation"):
                        for dev in (
                            (site.get(key) or [])
                            if isinstance(site.get(key), list)
                            else (
                                [site.get(key)]
                                if isinstance(site.get(key), dict) and site.get(key)
                                else []
                            )
                        ):
                            if isinstance(dev, dict) and dev.get("id"):
                                device_ids.add(str(dev["id"]))
                dev_root = client.get("devices") or {}
                if isinstance(dev_root, dict):
                    for key in ("server", "workstation", "mobile_device"):
                        node = dev_root.get(key)
                        if isinstance(node, dict):
                            inner = (node.get("client") or {}).get("site") or {}
                            arr = inner.get(
                                "server" if key == "server" else "workstation"
                            )
                            for dev in (
                                arr
                                if isinstance(arr, list)
                                else [arr] if isinstance(arr, dict) and arr else []
                            ):
                                if isinstance(dev, dict) and dev.get("id"):
                                    device_ids.add(str(dev["id"]))

            res["device_checks"] = {}
            res["device_outages"] = {}
            res["device_performance_history"] = {}
            res["device_exchange_storage_history"] = {}
            res["device_hardware"] = {}
            res["device_software"] = {}
            _max_devices = 30
            for i, device_id in enumerate(list(device_ids)[:_max_devices]):
                res["device_checks"][device_id] = list_check_by_device(device_id)
                res["device_outages"][device_id] = list_outages_by_device(device_id)
                res["device_performance_history"][device_id] = (
                    list_performance_history_by_device(device_id)
                )
                res["device_exchange_storage_history"][device_id] = (
                    list_exchange_storage_history_by_device(device_id)
                )
                res["device_hardware"][device_id] = list_hardware_by_asset(device_id)
                res["device_software"][device_id] = list_software_by_asset(device_id)

            res["clients"] = clients
            res["antivirus_products"] = antivirus_products
            return
        except Exception as e:
            res["clients"] = {"error": str(e)}
            return

    def init():
        get_clients()
        return res

    return init()


def get_dashboard_data(provider_data: list) -> dict:
    res = {}
    for provider in provider_data:
        for connection in provider.get("connections", []):
            for config in connection.get("connection_configs", []):
                try:
                    connectionstring = f"{connection.get('url')}/?apikey={connection.get('api_key')}{config.get('config_value','')}"

                    if "sentinelone" in connection.get("url"):
                        connectionstring = (
                            f"{connection.get('url')}/{config.get('config_value','')}"
                        )
                    print(connectionstring)
                    response = requests.get(
                        connectionstring,
                        headers={
                            "Authorization": f"ApiToken {config.get('api_key')}",
                        },
                    )
                    if response.headers.get("Content-Type") == "application/json":
                        res[config.get("config_name")] = response.json()
                    else:
                        res[config.get("config_name")] = xmltodict.parse(
                            response.content
                        )
                    continue
                except Exception as e:
                    res[config.get("config_name")] = {"error": str(e)}
                    continue
    return res


def get_sync_data():
    """Return combined SentinelOne + Nable RMM data; used by reporting views and sync endpoint."""
    syncdata = {
        "sentinelone": get_sentinel_one_data(),
        "nablermm": get_nablermm_data(),
    }
    return syncdata


def get_cached_sync_data():
    """Return reporting data from cache, or latest SyncRun.payload, or fetch and cache it."""
    data = cache.get(REPORTING_CACHE_KEY)
    if data is None:
        try:
            from reporting.models import SyncRun

            run = SyncRun.objects.order_by("-created_at").first()
            if run and isinstance(run.payload, dict):
                data = run.payload
                cache.set(REPORTING_CACHE_KEY, data, REPORTING_CACHE_TIMEOUT)
        except Exception:
            pass
        if data is None:
            data = get_sync_data()
            cache.set(REPORTING_CACHE_KEY, data, REPORTING_CACHE_TIMEOUT)
    return data


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def sync_data(request):
    """Fetch sync data from third-party APIs, persist to Sync* models, cache, and return."""
    try:
        res = get_sync_data()
        from reporting.core.store_sync import run_sync_and_store

        run_sync_and_store(sync_data=res)
        cache.set(REPORTING_CACHE_KEY, res, REPORTING_CACHE_TIMEOUT)
        cache.delete(DASHBOARD_CUSTOMERS_CACHE_KEY)
        return Response(res, status=status.HTTP_200_OK)
    except Exception as e:
        print(e)
        return Response(
            {"error": f"An error occurred while fetching the provider. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
