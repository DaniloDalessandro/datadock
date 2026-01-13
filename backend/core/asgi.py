"""
Configuração ASGI para o projeto core.
Expõe o callable ASGI como variável de módulo chamada 'application'.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

application = get_asgi_application()
