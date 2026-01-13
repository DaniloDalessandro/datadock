"""
Configuração de URLs do projeto DataPort
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from core.views import (
    DetailedHealthCheckView,
    HealthCheckView,
    LivenessCheckView,
    ReadinessCheckView,
)

urlpatterns = [
    path("admin/", admin.site.urls, name="admin:index"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # Health checks (sem autenticação)
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("health/detailed/", DetailedHealthCheckView.as_view(), name="health-detailed"),
    path("health/ready/", ReadinessCheckView.as_view(), name="health-ready"),
    path("health/live/", LivenessCheckView.as_view(), name="health-live"),
    # API v1
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/data-import/", include("data_import.urls")),
    path("api/v1/alice/", include("alice.urls")),
    # Legacy endpoints (compatibilidade retroativa)
    # TODO: Descontinuar endpoints legados sem versionamento
    path("api/auth/", include("accounts.urls")),
    path("api/data-import/", include("data_import.urls")),
    path("api/alice/", include("alice.urls")),
]
