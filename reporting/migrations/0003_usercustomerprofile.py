# Generated migration for UserCustomerProfile and Admin/Customer groups

import django.db.models.deletion
import django_mongodb_backend.fields
from django.conf import settings
from django.db import migrations, models


def _create_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.get_or_create(name="Admin")
    Group.objects.get_or_create(name="Customer")


class Migration(migrations.Migration):

    dependencies = [
        ("reporting", "0002_sync_models"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserCustomerProfile",
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
                (
                    "customer_id",
                    models.CharField(
                        help_text="Customer ID from sync (e.g. N-able clientid). This user will only see this customer's data.",
                        max_length=255,
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reporting_userprofile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "User customer profile",
                "verbose_name_plural": "User customer profiles",
            },
        ),
        migrations.RunPython(_create_groups, migrations.RunPython.noop),
    ]
