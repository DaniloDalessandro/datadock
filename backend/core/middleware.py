"""
Middlewares personalizados para o projeto DataPort
"""

import re


class APIVersionMiddleware:
    """
    Adiciona headers de versionamento da API nas respostas
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.path.startswith("/api/"):
            version_match = re.match(r"/api/v(\d+)/", request.path)
            if version_match:
                version = f"v{version_match.group(1)}"
            else:
                version = "v1"

            response["X-API-Version"] = version
            response["X-API-Deprecation-Warning"] = (
                (
                    "Legacy endpoints without version prefix are deprecated. "
                    "Please use /api/v1/ instead."
                )
                if not version_match
                else None
            )

        return response


class RequestIDMiddleware:
    """
    Adiciona ID único para cada request para rastreamento e logging estruturado
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        import uuid
        from threading import current_thread

        request_id = str(uuid.uuid4())[:8]
        request.request_id = request_id

        # Armazena request em thread local para contexto de logging
        thread = current_thread()
        thread.request = request

        try:
            response = self.get_response(request)
            response["X-Request-ID"] = request_id
            return response
        finally:
            if hasattr(thread, "request"):
                delattr(thread, "request")
