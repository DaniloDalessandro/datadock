"""
Custom middleware for DataPort project
"""

import re


class APIVersionMiddleware:
    """
    Middleware to add API version headers to responses
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add API version header to all API responses
        if request.path.startswith("/api/"):
            # Extract version from URL
            version_match = re.match(r"/api/v(\d+)/", request.path)
            if version_match:
                version = f"v{version_match.group(1)}"
            else:
                # Legacy endpoint - default to v1
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
    Middleware to add unique request ID for tracking and structured logging
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        import uuid
        from threading import current_thread

        # Generate unique request ID
        request_id = str(uuid.uuid4())[:8]
        request.request_id = request_id

        # Store request in thread local for logging context
        thread = current_thread()
        thread.request = request

        try:
            response = self.get_response(request)

            # Add request ID to response headers
            response["X-Request-ID"] = request_id

            return response
        finally:
            # Clean up thread local
            if hasattr(thread, "request"):
                delattr(thread, "request")
