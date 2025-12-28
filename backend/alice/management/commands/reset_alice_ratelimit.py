"""
Management command to reset Alice rate limiting
"""

from django.core.cache import cache
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Reset Alice rate limiting by clearing throttle cache"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user",
            type=str,
            help="Reset rate limit for specific user ID",
        )

    def handle(self, *args, **options):
        user_id = options.get("user")

        if user_id:
            # Clear rate limit for specific user
            cache_key_pattern = f"throttle_user_{user_id}_*"
            self.stdout.write(f"Clearing rate limit for user {user_id}...")
            # Note: This is a simple implementation. For Redis, you might want to use scan/delete
            (
                cache.delete_pattern(cache_key_pattern)
                if hasattr(cache, "delete_pattern")
                else cache.clear()
            )
            self.stdout.write(
                self.style.SUCCESS(f"Rate limit reset for user {user_id}")
            )
        else:
            # Clear all rate limits
            self.stdout.write("Clearing all rate limits...")
            cache.clear()
            self.stdout.write(self.style.SUCCESS("All rate limits reset successfully!"))

        self.stdout.write(
            self.style.WARNING("\nNote: Users can now make requests immediately.")
        )
        self.stdout.write("Current limit: 30 requests per minute per user")
