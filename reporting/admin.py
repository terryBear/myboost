from django.contrib import admin
from django.urls import path
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


class CustomerAdmin(admin.ModelAdmin):
    pass


class BackupDeviceAdmin(admin.ModelAdmin):
    pass


class DeviceAdmin(admin.ModelAdmin):
    pass


class PatchAdmin(admin.ModelAdmin):
    pass


class NetworkDeviceAdmin(admin.ModelAdmin):
    pass


class NetworkEventAdmin(admin.ModelAdmin):
    pass


class PatchDataAdmin(admin.ModelAdmin):
    pass


class DevicePatchStatusAdmin(admin.ModelAdmin):
    pass


class AntivirusDataAdmin(admin.ModelAdmin):
    pass


class SentinelOneDataAdmin(admin.ModelAdmin):
    pass


class SecuritySummaryAdmin(admin.ModelAdmin):
    pass


class TicketDataAdmin(admin.ModelAdmin):
    pass


class BranchTicketStatsAdmin(admin.ModelAdmin):
    pass


class ReportingAdmin(admin.ModelAdmin):
    list_display = ["customer", "uuid_field", "ref_code"]

    list_filter = [
        "customer",
    ]


admin.site.register(Reporting, ReportingAdmin)
admin.site.register(Customer, CustomerAdmin)
admin.site.register(BackupDevice, BackupDeviceAdmin)
admin.site.register(Device, DeviceAdmin)
admin.site.register(Patch, PatchAdmin)
admin.site.register(NetworkDevice, NetworkDeviceAdmin)
admin.site.register(NetworkEvent, NetworkEventAdmin)
admin.site.register(PatchData, PatchDataAdmin)
admin.site.register(DevicePatchStatus, DevicePatchStatusAdmin)
admin.site.register(AntivirusData, AntivirusDataAdmin)
admin.site.register(SentinelOneData, SentinelOneDataAdmin)
admin.site.register(SecuritySummary, SecuritySummaryAdmin)
admin.site.register(TicketData, TicketDataAdmin)
admin.site.register(BranchTicketStats, BranchTicketStatsAdmin)
