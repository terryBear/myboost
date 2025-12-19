from django.db import models
import uuid
import random
import string
from django.core.validators import MinValueValidator, MaxValueValidator

from django_mongodb_backend.models import EmbeddedModel
from django_mongodb_backend.fields import EmbeddedModelField, ArrayField


def generate_uuid_string():
    return str(uuid.uuid4())[:32]


def generate_random_string(length=10):
    characters = string.ascii_lowercase + string.digits
    return "".join(random.choices(characters, k=length))


# -----------------------
# Embedded / Nested Types
# -----------------------


class ProgressBar(EmbeddedModel):
    color = models.CharField(max_length=50)
    width = models.FloatField(validators=[MinValueValidator(0.0)])


class AlertEmbedded(EmbeddedModel):
    TYPE_CHOICES = [
        ("performance", "performance"),
        ("security", "security"),
        ("system", "system"),
        ("disk", "disk"),
        ("network", "network"),
    ]
    SEVERITY_CHOICES = [
        ("info", "info"),
        ("warning", "warning"),
        ("critical", "critical"),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    message = models.TextField()
    timestamp = models.DateTimeField()


class BandwidthEmbedded(EmbeddedModel):
    upload = models.FloatField(validators=[MinValueValidator(0.0)])
    download = models.FloatField(validators=[MinValueValidator(0.0)])


# -----------
# Root Models
# -----------


class Customer(models.Model):
    name = models.CharField(max_length=255)

    healthScore = models.FloatField(default=0, validators=[MinValueValidator(0.0)])
    devices = models.PositiveIntegerField(default=0)
    patchCompliance = models.FloatField(
        default=0, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    securityScore = models.FloatField(
        default=0, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )

    backupStatus = models.CharField(max_length=50)
    securityStatus = models.CharField(max_length=50)

    networkUptime = models.FloatField(default=0, validators=[MinValueValidator(0.0)])
    lastUpdated = models.DateTimeField()

    criticalThreats = models.PositiveIntegerField(default=0)
    patchingIssues = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class BackupDevice(models.Model):
    DEVICE_TYPE_CHOICES = [
        ("Workstation", "Workstation"),
        ("Server", "Server"),
        ("Documents", "Documents"),
        ("Not Installed", "Not Installed"),
    ]
    BACKUP_STATUS_CHOICES = [
        ("Completed", "Completed"),
        ("CompletedWithErrors", "CompletedWithErrors"),
        ("Failed", "Failed"),
        ("InProcess", "InProcess"),
        ("No backups", "No backups"),
    ]

    deviceName = models.CharField(max_length=255)
    computerName = models.CharField(max_length=255)
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="backup_devices"
    )

    deviceType = models.CharField(max_length=30, choices=DEVICE_TYPE_CHOICES)

    selectedSize = models.FloatField(default=0, validators=[MinValueValidator(0.0)])
    usedStorage = models.FloatField(default=0, validators=[MinValueValidator(0.0)])

    backupStatus = models.CharField(max_length=40, choices=BACKUP_STATUS_CHOICES)

    errors = models.PositiveIntegerField(default=0)
    lastBackup = models.DateTimeField()

    progressBars = ArrayField(
        EmbeddedModelField(ProgressBar),
        blank=True,
        default=list,
    )

    def __str__(self):
        return self.deviceName


class Device(models.Model):
    TYPE_CHOICES = [
        ("workstation", "workstation"),
        ("server", "server"),
        ("laptop", "laptop"),
        ("mobile", "mobile"),
    ]
    STATUS_CHOICES = [
        ("online", "online"),
        ("offline", "offline"),
        ("warning", "warning"),
        ("critical", "critical"),
    ]

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES)

    os = models.CharField(max_length=255)
    lastSeen = models.DateTimeField()
    uptime = models.FloatField(default=0, validators=[MinValueValidator(0.0)])

    cpu = models.FloatField(default=0, validators=[MinValueValidator(0.0)])
    memory = models.FloatField(default=0, validators=[MinValueValidator(0.0)])
    disk = models.FloatField(default=0, validators=[MinValueValidator(0.0)])

    temperature = models.FloatField(blank=True, null=True)

    location = models.CharField(max_length=255)
    user = models.CharField(max_length=255, blank=True, null=True)

    alerts = ArrayField(
        EmbeddedModelField(AlertEmbedded),
        blank=True,
        default=list,
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="devices_list",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class Patch(models.Model):
    TYPE_CHOICES = [
        ("security", "security"),
        ("feature", "feature"),
        ("bugfix", "bugfix"),
    ]
    STATUS_CHOICES = [
        ("pending", "pending"),
        ("installed", "installed"),
        ("failed", "failed"),
        ("scheduled", "scheduled"),
    ]

    deviceName = models.CharField(max_length=255)
    patchName = models.CharField(max_length=255)

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    releaseDate = models.DateTimeField()
    installDate = models.DateTimeField(blank=True, null=True)

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="patches",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.deviceName} - {self.patchName}"


class NetworkDevice(models.Model):
    TYPE_CHOICES = [
        ("gateway", "gateway"),
        ("switch", "switch"),
        ("access_point", "access_point"),
        ("camera", "camera"),
        ("phone", "phone"),
    ]
    STATUS_CHOICES = [
        ("online", "online"),
        ("offline", "offline"),
        ("warning", "warning"),
    ]

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES)

    uptime = models.FloatField(default=0, validators=[MinValueValidator(0.0)])
    location = models.CharField(max_length=255)

    ip = models.GenericIPAddressField()
    model = models.CharField(max_length=255)
    firmware = models.CharField(max_length=255)

    clients = models.PositiveIntegerField(default=0)

    bandwidth = EmbeddedModelField(BandwidthEmbedded)

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="network_devices",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class NetworkEvent(models.Model):
    EVENT_TYPE_CHOICES = [
        ("connection_lost", "connection_lost"),
        ("high_usage", "high_usage"),
        ("firmware_update", "firmware_update"),
        ("client_connected", "client_connected"),
        ("client_disconnected", "client_disconnected"),
    ]
    SEVERITY_CHOICES = [
        ("info", "info"),
        ("warning", "warning"),
        ("critical", "critical"),
    ]

    deviceName = models.CharField(max_length=255)
    eventType = models.CharField(max_length=40, choices=EVENT_TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)

    timestamp = models.DateTimeField()
    description = models.TextField()
    duration = models.CharField(max_length=50, blank=True, null=True)

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="network_events",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.deviceName} - {self.eventType}"


class PatchData(models.Model):
    STATUS_CHOICES = [
        ("Installed", "Installed"),
        ("Pending", "Pending"),
        ("Failed", "Failed"),
        ("Not Applicable", "Not Applicable"),
        ("Installing", "Installing"),
        ("Reboot Required", "Reboot Required"),
    ]

    # TS says id:number. In Mongo, keep your ObjectId PK + add external_id
    external_id = models.IntegerField(unique=True)

    device = models.CharField(max_length=255)
    client = models.CharField(max_length=255)
    site = models.CharField(max_length=255)
    patch = models.CharField(max_length=255)

    status = models.CharField(max_length=30, choices=STATUS_CHOICES)

    discovered_install_date = models.DateTimeField()
    created_at = models.DateTimeField()

    def __str__(self):
        return f"{self.device} - {self.patch}"


class DevicePatchStatus(models.Model):
    RISK_CHOICES = [
        ("Low", "Low"),
        ("Medium", "Medium"),
        ("High", "High"),
        ("Critical", "Critical"),
    ]

    deviceId = models.CharField(
        max_length=255
    )  # TS says string (often external system id)
    deviceName = models.CharField(max_length=255)
    os = models.CharField(max_length=255)

    totalPatches = models.PositiveIntegerField(default=0)
    installedPatches = models.PositiveIntegerField(default=0)
    pendingPatches = models.PositiveIntegerField(default=0)
    failedPatches = models.PositiveIntegerField(default=0)

    compliancePercentage = models.FloatField(
        default=0, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    lastScan = models.DateTimeField()

    riskLevel = models.CharField(max_length=20, choices=RISK_CHOICES)

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="device_patch_statuses",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.deviceName


class AntivirusData(models.Model):
    # TS says id:number => keep ObjectId PK + external_id
    external_id = models.IntegerField(unique=True)

    device_name = models.CharField(max_length=255)
    av_product_name = models.CharField(max_length=255)
    av_status = models.CharField(max_length=100)
    threat_count = models.PositiveIntegerField(default=0)

    last_update = models.DateTimeField()
    last_scan = models.DateTimeField()

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="antivirus_rows",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.device_name


class SentinelOneData(models.Model):
    # TS says id:number => keep ObjectId PK + external_id
    external_id = models.IntegerField(unique=True)

    endpoints = models.CharField(max_length=255)
    site = models.CharField(max_length=255)
    status = models.CharField(max_length=100)
    classification = models.CharField(max_length=100)
    confidence_level = models.CharField(max_length=100)
    threat_details = models.TextField()
    analyst_verdict = models.CharField(max_length=100)
    incident_status = models.CharField(max_length=100)

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="sentinelone_rows",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.endpoints


class SecuritySummary(models.Model):
    """
    Snapshot table (optional). If you only compute this on-the-fly,
    you can delete this model and expose a serializer only.
    """

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="security_summaries",
        null=True,
        blank=True,
    )

    totalDevices = models.PositiveIntegerField(default=0)
    antivirusInstalled = models.PositiveIntegerField(default=0)
    sentinelOneInstalled = models.PositiveIntegerField(default=0)
    protectedDevices = models.PositiveIntegerField(default=0)
    unprotectedDevices = models.PositiveIntegerField(default=0)
    activeThreats = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)


class TicketData(models.Model):
    PRIORITY_CHOICES = [
        ("Low", "Low"),
        ("Medium", "Medium"),
        ("High", "High"),
        ("Critical", "Critical"),
    ]
    STATUS_CHOICES = [
        ("Open", "Open"),
        ("In Progress", "In Progress"),
        ("Resolved", "Resolved"),
        ("Closed", "Closed"),
    ]

    subject = models.CharField(max_length=255)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="tickets"
    )
    branch = models.CharField(max_length=255)
    user = models.CharField(max_length=255)

    created = models.DateTimeField()
    updated = models.DateTimeField()

    category = models.CharField(max_length=255)
    description = models.TextField()

    def __str__(self):
        return self.subject


class BranchTicketStats(models.Model):
    """
    Snapshot table (optional). Often better computed via aggregation.
    """

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="branch_ticket_stats",
        null=True,
        blank=True,
    )

    branch = models.CharField(max_length=255)
    total = models.PositiveIntegerField(default=0)
    open = models.PositiveIntegerField(default=0)
    resolved = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)


class Reporting(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    uuid_field = models.CharField(
        max_length=32,
        default=generate_uuid_string,
        unique=True,
        editable=False,
    )

    ref_code = models.CharField(
        max_length=10,
        default=generate_random_string,
        unique=True,
        editable=False,
    )

    def __str__(self):
        return self.name
