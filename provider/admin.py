from django.contrib import admin
from django.db import models
from .models import Provider, ProviderConnection, ProviderConnectionConfig


class ProviderConnectionAdmin(admin.ModelAdmin):
    list_display = ["name", "url"]
    list_filter = [
        "provider",
    ]


class ProviderConnectionConfigAdmin(admin.ModelAdmin):
    list_display = ["provider_connection__name", "name"]
    list_filter = [
        "provider_connection",
    ]


class ProviderAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    list_filter = [
        "name",
    ]

    # actions = ["mark_as_published", "mark_as_unpublished"]

    # @admin.action(description="Publish selected blogs")
    # def mark_as_published(self, request, queryset):
    #     queryset.update(published=True)
    #     self.message_user(request, f"{queryset.count()} blogs published.")

    # @admin.action(description="Unpublish selected blogs")
    # def mark_as_unpublished(self, request, queryset):
    #     queryset.update(published=False)
    #     self.message_user(request, f"{queryset.count()} blogs unpublished.")

    # def save_model(self, request, obj, form, change):
    #     obj.username = request.user
    #     super().save_model(request, obj, form, change)
    #     print("SAVE MODEL DETECTED")


admin.site.register(Provider, ProviderAdmin)
admin.site.register(ProviderConnection, ProviderConnectionAdmin)
admin.site.register(ProviderConnectionConfig, ProviderConnectionConfigAdmin)
