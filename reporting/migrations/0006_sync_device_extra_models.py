# Generated manually for SyncDeviceCheck, SyncDeviceOutage, etc.

import django.db.models.deletion
import django_mongodb_backend.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reporting", "0005_sync_run_and_extended_sync_models"),
    ]

    operations = [
        migrations.CreateModel(
            name="SyncDeviceCheck",
            fields=[
                (
                    "id",
                    django_mongodb_backend.fields.ObjectIdAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("payload", models.JSONField(default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "device",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sync_device_checks",
                        to="reporting.syncdevice",
                    ),
                ),
            ],
            options={
                "ordering": ["device"],
            },
        ),
        migrations.CreateModel(
            name="SyncDeviceOutage",
            fields=[
                (
                    "id",
                    django_mongodb_backend.fields.ObjectIdAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("payload", models.JSONField(default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "device",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sync_device_outages",
                        to="reporting.syncdevice",
                    ),
                ),
            ],
            options={
                "ordering": ["device"],
            },
        ),
        migrations.CreateModel(
            name="SyncDevicePerformanceHistory",
            fields=[
                (
                    "id",
                    django_mongodb_backend.fields.ObjectIdAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("payload", models.JSONField(default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "device",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sync_device_performance_history",
                        to="reporting.syncdevice",
                    ),
                ),
            ],
            options={
                "ordering": ["device"],
            },
        ),
        migrations.CreateModel(
            name="SyncDeviceExchangeStorage",
            fields=[
                (
                    "id",
                    django_mongodb_backend.fields.ObjectIdAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("payload", models.JSONField(default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "device",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sync_device_exchange_storage",
                        to="reporting.syncdevice",
                    ),
                ),
            ],
            options={
                "ordering": ["device"],
            },
        ),
        migrations.CreateModel(
            name="SyncDeviceHardware",
            fields=[
                (
                    "id",
                    django_mongodb_backend.fields.ObjectIdAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("payload", models.JSONField(default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "device",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sync_device_hardware",
                        to="reporting.syncdevice",
                    ),
                ),
            ],
            options={
                "ordering": ["device"],
            },
        ),
        migrations.CreateModel(
            name="SyncDeviceSoftware",
            fields=[
                (
                    "id",
                    django_mongodb_backend.fields.ObjectIdAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("payload", models.JSONField(default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "device",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sync_device_software",
                        to="reporting.syncdevice",
                    ),
                ),
            ],
            options={
                "ordering": ["device"],
            },
        ),
        migrations.AddConstraint(
            model_name="syncdevicecheck",
            constraint=models.UniqueConstraint(
                fields=("device",),
                name="unique_sync_device_check_per_device",
            ),
        ),
        migrations.AddConstraint(
            model_name="syncdeviceoutage",
            constraint=models.UniqueConstraint(
                fields=("device",),
                name="unique_sync_device_outage_per_device",
            ),
        ),
        migrations.AddConstraint(
            model_name="syncdeviceperformancehistory",
            constraint=models.UniqueConstraint(
                fields=("device",),
                name="unique_sync_device_perf_history_per_device",
            ),
        ),
        migrations.AddConstraint(
            model_name="syncdeviceexchangestorage",
            constraint=models.UniqueConstraint(
                fields=("device",),
                name="unique_sync_device_exchange_storage_per_device",
            ),
        ),
        migrations.AddConstraint(
            model_name="syncdevicehardware",
            constraint=models.UniqueConstraint(
                fields=("device",),
                name="unique_sync_device_hardware_per_device",
            ),
        ),
        migrations.AddConstraint(
            model_name="syncdevicesoftware",
            constraint=models.UniqueConstraint(
                fields=("device",),
                name="unique_sync_device_software_per_device",
            ),
        ),
    ]
