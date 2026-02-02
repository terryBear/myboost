from django.conf import settings
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


class UserCustomerProfile(models.Model):
    """
    Links a Django User to a single customer (by N-able clientid / dashboard customer id).
    When a user has this profile with customer_id set, they see only that customer's data
    when using the Coffee or Boost Coffee dashboard APIs.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reporting_userprofile",
    )
    customer_id = models.CharField(
        max_length=255,
        help_text="Customer ID from sync (e.g. N-able clientid). This user will only see this customer's data.",
    )

    class Meta:
        verbose_name = "User customer profile"
        verbose_name_plural = "User customer profiles"

    def __str__(self):
        return f"{self.user.username} → {self.customer_id}"


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
        return f"Reporting {self.ref_code}"


# -------------------------------------------------------------------------
# Sync storage: provider -> clients -> sites -> devices / failing_checks
# Structure matches dummy (1).json; all data mapped back to a client.
# -------------------------------------------------------------------------


class SyncRun(models.Model):
    """
    Full raw payload from get_sync_data(); ensures all API response data is stored.
    One record per sync; normalized Sync* models are derived from this.
    """

    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"SyncRun {self.created_at.isoformat()}"


class SyncProvider(models.Model):
    """Provider key from sync payload (e.g. provider_acme, nablermm)."""

    slug = models.SlugField(max_length=100, unique=True)
    name = models.CharField(max_length=255, blank=True)
    raw_metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Provider-level data (e.g. antivirus_products from nablermm).",
    )

    class Meta:
        ordering = ["slug"]

    def __str__(self):
        return self.slug


class SyncClient(models.Model):
    """Client under a provider; unique per (provider, clientid)."""

    provider = models.ForeignKey(
        SyncProvider, on_delete=models.CASCADE, related_name="sync_clients"
    )
    clientid = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    creation_date = models.CharField(max_length=50, blank=True)
    device_count = models.PositiveIntegerField(null=True, blank=True)
    server_count = models.PositiveIntegerField(null=True, blank=True)
    workstation_count = models.PositiveIntegerField(null=True, blank=True)
    mobile_device_count = models.PositiveIntegerField(null=True, blank=True)
    timezone = models.CharField(max_length=100, blank=True)
    view_dashboard = models.CharField(max_length=20, blank=True)
    view_wkstsn_assets = models.CharField(max_length=20, blank=True)
    dashboard_username = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["provider", "clientid"]
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "clientid"],
                name="unique_sync_client_provider_clientid",
            )
        ]

    def __str__(self):
        return f"{self.provider.slug}/{self.clientid} {self.name}"


class SyncSite(models.Model):
    """Site under a client; unique per (client, siteid)."""

    client = models.ForeignKey(
        SyncClient, on_delete=models.CASCADE, related_name="sync_sites"
    )
    siteid = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    connection_ok = models.CharField(max_length=20, blank=True)
    creation_date = models.CharField(max_length=50, blank=True)
    raw_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["client", "siteid"]
        constraints = [
            models.UniqueConstraint(
                fields=["client", "siteid"], name="unique_sync_site_client_siteid"
            )
        ]

    def __str__(self):
        return f"{self.client} / {self.name}"


class SyncDevice(models.Model):
    """Device (server/workstation) under a client/site; unique per (client, site, external_id)."""

    DEVICE_TYPE_CHOICES = [("server", "server"), ("workstation", "workstation")]

    client = models.ForeignKey(
        SyncClient, on_delete=models.CASCADE, related_name="sync_devices"
    )
    site = models.ForeignKey(
        SyncSite,
        on_delete=models.CASCADE,
        related_name="sync_devices",
        null=True,
        blank=True,
    )
    external_id = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default="unknown")
    username = models.CharField(max_length=255, blank=True)
    description = models.CharField(max_length=255, blank=True)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPE_CHOICES)
    raw_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["client", "site", "external_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["client", "site", "external_id"],
                name="unique_sync_device_client_site_id",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.external_id})"


class SyncFailingCheck(models.Model):
    """Failing check tied to a client (and optionally device); no duplicates by (client, device, start_date, start_time)."""

    client = models.ForeignKey(
        SyncClient, on_delete=models.CASCADE, related_name="sync_failing_checks"
    )
    device = models.ForeignKey(
        SyncDevice,
        on_delete=models.CASCADE,
        related_name="sync_failing_checks",
        null=True,
        blank=True,
    )
    description = models.TextField(blank=True)
    start_date = models.CharField(max_length=50, blank=True)
    start_time = models.CharField(max_length=50, blank=True)
    raw_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["client", "start_date", "start_time"]
        constraints = [
            models.UniqueConstraint(
                fields=["client", "device", "start_date", "start_time"],
                name="unique_sync_failing_check_client_device_datetime",
            )
        ]

    def __str__(self):
        return f"{self.client}: {self.description[:50]}"


class SyncDeviceCheck(models.Model):
    """Checks by device; payload from N-able list_checks."""

    device = models.ForeignKey(
        SyncDevice, on_delete=models.CASCADE, related_name="sync_device_checks"
    )
    payload = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["device"]
        constraints = [
            models.UniqueConstraint(
                fields=["device"],
                name="unique_sync_device_check_per_device",
            )
        ]

    def __str__(self):
        return f"Checks for {self.device}"


class SyncDeviceOutage(models.Model):
    """Outages by device; payload from N-able list_outages."""

    device = models.ForeignKey(
        SyncDevice, on_delete=models.CASCADE, related_name="sync_device_outages"
    )
    payload = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["device"]
        constraints = [
            models.UniqueConstraint(
                fields=["device"],
                name="unique_sync_device_outage_per_device",
            )
        ]

    def __str__(self):
        return f"Outages for {self.device}"


class SyncDevicePerformanceHistory(models.Model):
    """Performance history by device; payload from N-able list_performance_history."""

    device = models.ForeignKey(
        SyncDevice,
        on_delete=models.CASCADE,
        related_name="sync_device_performance_history",
    )
    payload = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["device"]
        constraints = [
            models.UniqueConstraint(
                fields=["device"],
                name="unique_sync_device_perf_history_per_device",
            )
        ]

    def __str__(self):
        return f"Performance for {self.device}"


class SyncDeviceExchangeStorage(models.Model):
    """Exchange storage history by device; payload from N-able list_exchange_storage_history."""

    device = models.ForeignKey(
        SyncDevice,
        on_delete=models.CASCADE,
        related_name="sync_device_exchange_storage",
    )
    payload = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["device"]
        constraints = [
            models.UniqueConstraint(
                fields=["device"],
                name="unique_sync_device_exchange_storage_per_device",
            )
        ]

    def __str__(self):
        return f"Exchange storage for {self.device}"


class SyncDeviceHardware(models.Model):
    """Hardware by asset (device); payload from N-able list_all_hardware."""

    device = models.ForeignKey(
        SyncDevice,
        on_delete=models.CASCADE,
        related_name="sync_device_hardware",
    )
    payload = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["device"]
        constraints = [
            models.UniqueConstraint(
                fields=["device"],
                name="unique_sync_device_hardware_per_device",
            )
        ]

    def __str__(self):
        return f"Hardware for {self.device}"


class SyncDeviceSoftware(models.Model):
    """Software by asset (device); payload from N-able list_all_software."""

    device = models.ForeignKey(
        SyncDevice,
        on_delete=models.CASCADE,
        related_name="sync_device_software",
    )
    payload = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["device"]
        constraints = [
            models.UniqueConstraint(
                fields=["device"],
                name="unique_sync_device_software_per_device",
            )
        ]

    def __str__(self):
        return f"Software for {self.device}"


class FaultReport(models.Model):
    """Contact/fault report from the app; stored and emailed to all staff users."""

    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=254)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} from {self.email}"
