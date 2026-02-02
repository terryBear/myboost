from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.core.exceptions import ObjectDoesNotExist
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
    UserCustomerProfile,
    FaultReport,
)

User = get_user_model()


class UserCustomerProfileInline(admin.StackedInline):
    model = UserCustomerProfile
    can_delete = True
    verbose_name_plural = "Customer link (this user will only see this customer's data)"
    fk_name = "user"


class UserAdminWithCustomer(BaseUserAdmin):
    """User admin with inline to link user to a customer (for Customer group users)."""

    inlines = (UserCustomerProfileInline,)
    list_display = BaseUserAdmin.list_display + ("_customer_id",)
    list_filter = ("is_staff", "is_superuser", "is_active", "groups")

    def _customer_id(self, obj):
        try:
            return obj.reporting_userprofile.customer_id
        except ObjectDoesNotExist:
            return "—"

    _customer_id.short_description = "Customer ID"


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


# Re-register User with customer profile inline so admins can link users to customers
admin.site.unregister(User)
admin.site.register(User, UserAdminWithCustomer)


class UserCustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "customer_id")
    list_filter = ("customer_id",)
    search_fields = ("user__username", "customer_id")


admin.site.register(UserCustomerProfile, UserCustomerProfileAdmin)
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


@admin.register(FaultReport)
class FaultReportAdmin(admin.ModelAdmin):
    list_display = ("subject", "name", "email", "created_at")
    list_filter = ("created_at",)
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = ("created_at",)
