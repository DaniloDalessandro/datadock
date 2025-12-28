from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CompanyViewSet,
    CustomTokenObtainPairView,
    ExternalProfileViewSet,
    InternalProfileViewSet,
    LogoutView,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"companies", CompanyViewSet, basename="company")
router.register(r"users", UserViewSet, basename="user")
router.register(
    r"internal-profiles", InternalProfileViewSet, basename="internalprofile"
)
router.register(
    r"external-profiles", ExternalProfileViewSet, basename="externalprofile"
)

urlpatterns = [
    path("login", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("", include(router.urls)),
]
