"""
Views de health checks e monitoramento do sistema
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
    Health check básico - verifica apenas conexão com database
    """

    permission_classes = [AllowAny]

    def get(self, request):
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
    Health check detalhado com status de todos os componentes
    """

    permission_classes = [AllowAny]

    def get(self, request):
        health_data = get_system_health()

        health_data["app"] = {
            "name": "DataPort",
            "environment": "development" if settings.DEBUG else "production",
            "debug": settings.DEBUG,
        }

        if health_data["status"] == "healthy":
            http_status = status.HTTP_200_OK
        elif health_data["status"] == "degraded":
            http_status = status.HTTP_200_OK
        else:
            http_status = status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(health_data, status=http_status)


class ReadinessCheckView(APIView):
    """
    Readiness probe (estilo Kubernetes) - verifica se app está pronta para servir tráfego
    """

    permission_classes = [AllowAny]

    def get(self, request):
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
    Liveness probe (estilo Kubernetes) - retorna OK se app está viva
    """

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {"alive": True, "message": "Application is alive"},
            status=status.HTTP_200_OK,
        )
