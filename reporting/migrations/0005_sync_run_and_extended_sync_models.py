# Generated manually for SyncRun and extended Sync* fields

import django_mongodb_backend.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reporting", "0004_fault_report"),
    ]

    operations = [
        migrations.CreateModel(
            name="SyncRun",
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
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddField(
            model_name="syncprovider",
            name="raw_metadata",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Provider-level data (e.g. antivirus_products from nablermm).",
            ),
        ),
        migrations.AddField(
            model_name="syncclient",
            name="server_count",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="syncclient",
            name="workstation_count",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="syncclient",
            name="mobile_device_count",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="syncclient",
            name="timezone",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="syncclient",
            name="view_dashboard",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="syncclient",
            name="view_wkstsn_assets",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="syncclient",
            name="dashboard_username",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="syncsite",
            name="connection_ok",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="syncsite",
            name="creation_date",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name="syncsite",
            name="raw_data",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="syncdevice",
            name="description",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="syncdevice",
            name="raw_data",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
