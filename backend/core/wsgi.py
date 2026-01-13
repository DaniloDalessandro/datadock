"""
Configuração WSGI para o projeto core.
Expõe o callable WSGI como variável de módulo chamada 'application'.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

application = get_wsgi_application()
