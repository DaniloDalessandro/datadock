"""
Core views for health checks and system monitoring
"""

from django.conf import settings
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .health_checks import check_database, get_system_health


@extend_schema(
    tags=["Health"],
    summary="Health check básico",
    description="Verifica se o sistema está operacional (database apenas)",
    responses={
        200: OpenApiTypes.OBJECT,
        503: OpenApiTypes.OBJECT,
    },
)
class HealthCheckView(APIView):
    """
    Basic health check endpoint
    GET /health/
    Returns 200 OK if system is operational
    """

    permission_classes = [AllowAny]

    def get(self, request):
        """
        Simple health check - just verify database connection
        """
        db_check = check_database()

        if db_check["status"] == "healthy":
            return Response(
                {"status": "ok", "message": "System is healthy"},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"status": "error", "message": "System is unhealthy"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


@extend_schema(
    tags=["Health"],
    summary="Health check detalhado",
    description="""
    Retorna status detalhado de todos os componentes do sistema.

    **Componentes verificados:**
    - Database (PostgreSQL/SQLite)
    - Cache (Redis)
    - Celery workers
    - Disk space
    """,
    responses={
        200: OpenApiTypes.OBJECT,
        503: OpenApiTypes.OBJECT,
    },
)
class DetailedHealthCheckView(APIView):
    """
    Detailed health check endpoint with all system components
    GET /health/detailed/
    Returns detailed status of all system components
    """

    permission_classes = [AllowAny]

    def get(self, request):
        """
        Detailed health check with all components
        """
        health_data = get_system_health()

        # Add application info
        health_data["app"] = {
            "name": "DataPort",
            "environment": "development" if settings.DEBUG else "production",
            "debug": settings.DEBUG,
        }

        # Determine HTTP status code based on overall health
        if health_data["status"] == "healthy":
            http_status = status.HTTP_200_OK
        elif health_data["status"] == "degraded":
            http_status = status.HTTP_200_OK  # Still operational but degraded
        else:
            http_status = status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(health_data, status=http_status)


class ReadinessCheckView(APIView):
    """
    Kubernetes-style readiness probe
    GET /health/ready/
    Returns 200 if app is ready to serve traffic
    """

    permission_classes = [AllowAny]

    def get(self, request):
        """
        Check if application is ready to serve requests
        """
        db_check = check_database()

        if db_check["status"] == "healthy":
            return Response(
                {"ready": True, "message": "Application is ready"},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"ready": False, "message": "Application is not ready"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class LivenessCheckView(APIView):
    """
    Kubernetes-style liveness probe
    GET /health/live/
    Returns 200 if app is alive (always returns OK unless app is completely down)
    """

    permission_classes = [AllowAny]

    def get(self, request):
        """
        Simple liveness check - if this responds, the app is alive
        """
        return Response(
            {"alive": True, "message": "Application is alive"},
            status=status.HTTP_200_OK,
        )
