"""
Management command: run sync and store once, or every 5 minutes.

Usage:
  python manage.py sync_and_store           # run once
  python manage.py sync_and_store --loop   # run every 5 minutes (Ctrl+C to stop)
"""

import logging
import time

from django.core.management.base import BaseCommand

from reporting.core.store_sync import run_sync_and_store

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Call get_sync_data(), normalize to provider->clients, upsert into Sync* tables. Use --loop to run every 5 minutes."

    def add_arguments(self, parser):
        parser.add_argument(
            "--loop",
            action="store_true",
            help="Run every 5 minutes until interrupted (Ctrl+C).",
        )

    def handle(self, *args, **options):
        if options["loop"]:
            self.stdout.write(
                "Running sync-and-store every 5 minutes (Ctrl+C to stop)."
            )
            interval = 5 * 60  # seconds
            while True:
                try:
                    run_sync_and_store()
                    self.stdout.write(self.style.SUCCESS("Sync-and-store completed."))
                except Exception as e:
                    logger.exception("sync_and_store failed: %s", e)
                    self.stdout.write(self.style.ERROR(f"Error: {e}"))
                time.sleep(interval)
        else:
            try:
                run_sync_and_store()
                self.stdout.write(self.style.SUCCESS("Sync-and-store completed."))
            except Exception as e:
                logger.exception("sync_and_store failed: %s", e)
                raise
