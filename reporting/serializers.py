from rest_framework import serializers

from .models import (
    Customer,
    BackupDevice,
    Device,
    Patch,
    NetworkDevice,
    NetworkEvent,
    PatchData,
    DevicePatchStatus,
    AntivirusData,
    SentinelOneData,
    SecuritySummary,
    TicketData,
    BranchTicketStats,
    Reporting,
)


# -----------------------
# Embedded serializers
# -----------------------


class ProgressBarSerializer(serializers.Serializer):
    color = serializers.CharField()
    width = serializers.FloatField()


class AlertSerializer(serializers.Serializer):
    type = serializers.CharField()
    severity = serializers.CharField()
    message = serializers.CharField()
    timestamp = serializers.DateTimeField()


class BandwidthSerializer(serializers.Serializer):
    upload = serializers.FloatField()
    download = serializers.FloatField()


# -----------------------
# Root serializers
# -----------------------


class CustomerSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = Customer
        fields = "__all__"


class BackupDeviceSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all())
    progressBars = ProgressBarSerializer(many=True)

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = BackupDevice
        fields = "__all__"


class DeviceSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    alerts = AlertSerializer(many=True)
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
    )

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = Device
        fields = "__all__"


class PatchSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
    )

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = Patch
        fields = "__all__"


class NetworkDeviceSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    bandwidth = BandwidthSerializer()
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
    )

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = NetworkDevice
        fields = "__all__"


class NetworkEventSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
    )

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = NetworkEvent
        fields = "__all__"


class PatchDataSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    def get_id(self, obj):
        # keep API consistent with your other endpoints (string ObjectId)
        return str(obj.id)

    class Meta:
        model = PatchData
        fields = "__all__"


class DevicePatchStatusSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
    )

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = DevicePatchStatus
        fields = "__all__"


class AntivirusDataSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
    )

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = AntivirusData
        fields = "__all__"


class SentinelOneDataSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
    )

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = SentinelOneData
        fields = "__all__"


class SecuritySummarySerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
    )

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = SecuritySummary
        fields = "__all__"


class TicketDataSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all())

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = TicketData
        fields = "__all__"


class BranchTicketStatsSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
    )

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = BranchTicketStats
        fields = "__all__"


class ReportingSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
    )

    def get_id(self, obj):
        return str(obj.id)

    class Meta:
        model = Reporting
        fields = "__all__"
