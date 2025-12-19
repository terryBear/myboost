from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

import requests
import xmltodict


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
                        if "results" in serverresponse:
                            if "items" in serverresponse:
                                if "servers" in serverresponse:
                                    servers = serverresponse["result"]["items"][
                                        "server"
                                    ]

                        # Get workstations per site
                        workstationresponse = get_workstations_per_site(site["siteid"])
                        if "results" in workstationresponse:
                            if "items" in workstationresponse:
                                if "workstations" in workstationresponse:
                                    workstations = workstationresponse["result"][
                                        "items"
                                    ]["workstation"]

                        # Get agentless assets per site
                        agentlessresponse = get_agentless_assets_per_site(
                            site["siteid"]
                        )
                        if "results" in agentlessresponse:
                            if "items" in agentlessresponse:
                                if "agentless_assets" in agentlessresponse:
                                    agentless_assets = agentlessresponse["result"][
                                        "items"
                                    ]["agentless_asset"]

                elif isinstance(site, list):
                    for s in site:
                        if "siteid" in s:
                            # Get servers per site
                            serverresponse = get_servers_per_site(s["siteid"])
                            if "results" in serverresponse:
                                if "items" in serverresponse:
                                    if "servers" in serverresponse:
                                        servers.extend(
                                            serverresponse["result"]["items"]["server"]
                                        )

                            # Get workstations per site
                            workstationresponse = get_workstations_per_site(s["siteid"])
                            if "results" in workstationresponse:
                                if "items" in workstationresponse:
                                    if "workstations" in workstationresponse:
                                        workstations.extend(
                                            workstationresponse["result"]["items"][
                                                "workstation"
                                            ]
                                        )

                            # Get agentless assets per site
                            agentlessresponse = get_agentless_assets_per_site(
                                s["siteid"]
                            )
                            if "results" in agentlessresponse:
                                if "items" in agentlessresponse:
                                    if "agentless_assets" in agentlessresponse:
                                        agentless_assets.extend(
                                            agentlessresponse["result"]["items"][
                                                "agentless_asset"
                                            ]
                                        )

                site["servers"] = servers
                site["workstations"] = workstations
                site["agentless_assets"] = agentless_assets

                client["sites"] = site
                client["devices"] = devices
                client["failing_checks"] = checks

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


@api_view(["GET"])
def sync_data(request):
    try:
        res = {
            "sentinelone": get_sentinel_one_data(),
            "nablermm": get_nablermm_data(),
        }
        return Response(res, status=status.HTTP_200_OK)
    except Exception as e:
        print(e)
        return Response(
            {"error": f"An error occurred while fetching the provider. {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
