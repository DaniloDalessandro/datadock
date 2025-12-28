from django.apps import AppConfig


class AliceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "alice"
    verbose_name = "Alice AI Assistant"

    def ready(self):
        """Importa signals quando a aplicação estiver pronta"""
        import alice.signals  # noqa
