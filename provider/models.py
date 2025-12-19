from django.db import models
from datetime import datetime


class Provider(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name = "Provider"
        verbose_name_plural = "Providers"

    def __str__(self):
        return self.name


class ProviderConnection(models.Model):
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    url = models.URLField()
    api_key = models.CharField(max_length=2550)

    class Meta:
        verbose_name = "Connection"
        verbose_name_plural = "Connections"

    def __str__(self):
        return f"{self.provider.name} - {self.name}"


class ProviderConnectionConfig(models.Model):
    provider_connection = models.ForeignKey(
        ProviderConnection, on_delete=models.CASCADE
    )
    name = models.CharField(max_length=100)
    config_name = models.CharField(max_length=100)
    config_value = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Connection Config"
        verbose_name_plural = "Connection Configs"

    def __str__(self):
        return f"{self.provider_connection.provider.name} - {self.name}"


# class Threat(models.Model):
#     endpoints = models.CharField(max_length=100, default='unknown')
#     account = models.CharField(max_length=100, default='unknown')
#     site = models.CharField(max_length=100, default='unknown')
#     group_name = models.CharField(max_length=100, default='unknown')
#     threat_details = models.CharField(max_length=100, default='unknown')
#     classification = models.CharField(max_length=100, default='unknown')
#     status = models.CharField(max_length=100, default='active')
#     incident_status = models.CharField(max_length=100, default='unknown')
#     confidence_level = models.CharField(max_length=10, default='unknown')
#     analyst_verdict = models.CharField(max_length=100, default='unknown')
#     identifying_time_utc = models.DateTimeField()
#     reported_time_utc = models.DateTimeField()
#     mitigated_preemptively = models.BooleanField()
#     reboot_required = models.BooleanField(default=False)
#     originating_process = models.CharField(max_length=100, default='unknown')
#     detecting_engine = models.CharField(max_length=100, default='unknown')
#     initiated_by = models.CharField(max_length=100, default='unknown')
#     agent_version = models.CharField(max_length=100, default='unknown')
#     agent_version_on_detection = models.CharField(max_length=100, default='unknown')
#     hash = models.CharField(max_length=100, default='unknown')
#     path = models.CharField(max_length=100, default='unknown')
#     completed_actions = models.CharField(max_length=100, default='none')
#     pending_actions = models.CharField(max_length=100, default='none')
#     failed_actions = models.CharField(max_length=100, default='none')
#     policy_at_detection = models.CharField(max_length=100, default='default')
#     external_ticket_id = models.CharField(max_length=100, default='unknown')

#     def __str__(self):
#         return self.name
