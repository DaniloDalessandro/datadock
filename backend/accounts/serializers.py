from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Company, ExternalProfile, InternalProfile

User = get_user_model()


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "cnpj",
            "email",
            "phone",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class InternalProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternalProfile
        fields = [
            "id",
            "department",
            "position",
            "employee_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class ExternalProfileSerializer(serializers.ModelSerializer):
    external_type_display = serializers.CharField(
        source="get_external_type_display", read_only=True
    )

    class Meta:
        model = ExternalProfile
        fields = [
            "id",
            "company_name",
            "external_type",
            "external_type_display",
            "cnpj",
            "contact_person",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    companies = CompanySerializer(many=True, read_only=True)
    company_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Company.objects.all(),
        write_only=True,
        required=False,
        source="companies",
    )
    internal_profile = InternalProfileSerializer(read_only=True)
    external_profile = ExternalProfileSerializer(read_only=True)
    profile_type_display = serializers.CharField(
        source="get_profile_type_display", read_only=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "cpf",
            "is_active",
            "profile_type",
            "profile_type_display",
            "companies",
            "company_ids",
            "internal_profile",
            "external_profile",
            "must_change_password",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "must_change_password"]

    def create(self, validated_data):
        """Cria usuário usando camada de serviço"""
        from .services import UserService

        username = validated_data.pop("username")
        email = validated_data.pop("email")

        user, _ = UserService.create_user_with_temporary_password(
            username=username, email=email, **validated_data
        )

        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("As senhas não coincidem.")
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("As senhas não coincidem.")
        return data


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer customizado para permitir login com email ao invés de username"""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if "username" in self.fields:
            del self.fields["username"]

    def validate(self, attrs):
        """Valida credenciais usando camada de serviço"""
        from .services import UserService

        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            is_valid, user, error_message = UserService.validate_user_credentials(
                email, password
            )

            if not is_valid:
                raise serializers.ValidationError({"non_field_errors": [error_message]})

            attrs[self.username_field] = user.username

        data = super().validate(attrs)

        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "profile_type": getattr(self.user, "profile_type", None),
            "is_superuser": self.user.is_superuser,
        }

        return data
