from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Company, ExternalProfile, InternalProfile
from .permissions import CanManageCompanies, CanManageUsers
from .serializers import (
    ChangePasswordSerializer,
    CompanySerializer,
    CustomTokenObtainPairSerializer,
    ExternalProfileSerializer,
    InternalProfileSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserSerializer,
)
from .services import UserService

User = get_user_model()


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [CanManageCompanies]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["is_active", "created_by"]
    search_fields = ["name", "cnpj", "email"]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["name"]

    def get_queryset(self):
        """
        Retorna empresas baseado nas permissões do usuário.
        Staff vê todas, usuários comuns apenas suas empresas.
        """
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Company.objects.all()
        return user.companies.all()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related(
        "internal_profile", "external_profile"
    ).prefetch_related("companies")
    serializer_class = UserSerializer
    permission_classes = [CanManageUsers]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["is_active", "profile_type", "is_staff", "companies"]
    search_fields = ["username", "email", "first_name", "last_name", "cpf"]
    ordering_fields = ["username", "email", "created_at", "updated_at"]
    ordering = ["username"]

    def get_permissions(self):
        """
        Define permissões específicas por ação.
        """
        if self.action in ["me", "change_password"]:
            return [IsAuthenticated()]
        elif self.action in ["request_password_reset", "reset_password"]:
            return [AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def request_password_reset(self, request):
        """Solicita redefinição de senha usando camada de serviço"""
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        UserService.request_password_reset(email)

        return Response(
            {"message": "Se o email existir, um link de redefinição será enviado."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def reset_password(self, request):
        """Redefine a senha usando o token via camada de serviço"""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        success, error_message, user = UserService.reset_password_with_token(
            token, new_password
        )

        if success:
            return Response(
                {"message": "Senha redefinida com sucesso."}, status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": error_message}, status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Altera a senha do usuário autenticado via camada de serviço"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data["old_password"]
        new_password = serializer.validated_data["new_password"]

        success, error_message = UserService.change_password(
            user, old_password, new_password
        )

        if success:
            return Response(
                {"message": "Senha alterada com sucesso."}, status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": error_message}, status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Retorna os dados do usuário autenticado"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class InternalProfileViewSet(viewsets.ModelViewSet):
    queryset = InternalProfile.objects.select_related("user")
    serializer_class = InternalProfileSerializer
    permission_classes = [CanManageUsers]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["department"]
    search_fields = [
        "user__username",
        "user__email",
        "department",
        "position",
        "employee_id",
    ]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]


class ExternalProfileViewSet(viewsets.ModelViewSet):
    queryset = ExternalProfile.objects.select_related("user")
    serializer_class = ExternalProfileSerializer
    permission_classes = [CanManageUsers]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["external_type"]
    search_fields = ["user__username", "user__email", "company_name", "cnpj"]
    ordering_fields = ["created_at", "updated_at", "company_name"]
    ordering = ["company_name"]


class CustomTokenObtainPairView(TokenObtainPairView):
    """View de login customizada com suporte a email"""

    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """View de logout que coloca o refresh token na blacklist"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response(
                {"message": "Logout realizado com sucesso."}, status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {"error": "Token inválido ou já utilizado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
