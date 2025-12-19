from rest_framework import serializers
from .models import (
    Provider,
    ProviderConnection,
    ProviderConnectionConfig,
)


class ProviderSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    connections = serializers.SerializerMethodField()

    def get_id(self, obj):
        return str(obj.id)

    def get_connections(self, obj):
        qs = ProviderConnection.objects.filter(provider=obj)
        return ProviderConnectionSerializer(qs, many=True).data

    class Meta:
        model = Provider
        fields = ["id", "name", "slug", "connections"]


class ProviderConnectionSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    connection_configs = serializers.SerializerMethodField()

    def get_connection_configs(self, obj):
        qs = ProviderConnectionConfig.objects.filter(provider_connection=obj)
        return ProviderConnectionConfigSerializer(qs, many=True).data

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = ProviderConnection
        fields = ["id", "name", "url", "api_key", "connection_configs"]


class ProviderConnectionConfigSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = ProviderConnectionConfig
        fields = [
            "id",
            "name",
            "config_name",
            "config_value",
        ]
