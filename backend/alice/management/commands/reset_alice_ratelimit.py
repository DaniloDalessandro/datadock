"""
Comando de gerenciamento para resetar rate limiting do Alice.
"""

from django.core.cache import cache
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Reseta o rate limiting do Alice limpando o cache de throttle"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user",
            type=str,
            help="Reseta rate limit para um usuário específico",
        )

    def handle(self, *args, **options):
        user_id = options.get("user")

        if user_id:
            cache_key_pattern = f"throttle_user_{user_id}_*"
            self.stdout.write(f"Limpando rate limit para usuário {user_id}...")
            # Para Redis, considere usar scan/delete
            (
                cache.delete_pattern(cache_key_pattern)
                if hasattr(cache, "delete_pattern")
                else cache.clear()
            )
            self.stdout.write(
                self.style.SUCCESS(f"Rate limit resetado para usuário {user_id}")
            )
        else:
            self.stdout.write("Limpando todos os rate limits...")
            cache.clear()
            self.stdout.write(self.style.SUCCESS("Todos os rate limits resetados com sucesso!"))

        self.stdout.write(
            self.style.WARNING("\nNota: Usuários podem fazer requisições imediatamente.")
        )
        self.stdout.write("Limite atual: 30 requisições por minuto por usuário")
