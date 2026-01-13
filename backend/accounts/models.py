import secrets

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models
from django.utils.crypto import get_random_string


class Company(models.Model):
    name = models.CharField("Nome", max_length=200, db_index=True)
    cnpj = models.CharField(
        "CNPJ",
        max_length=18,
        unique=True,
        db_index=True,
        validators=[
            RegexValidator(
                regex=r"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$",
                message="CNPJ deve estar no formato: 00.000.000/0000-00",
            )
        ],
        help_text="CNPJ da empresa (Formato: 00.000.000/0000-00)",
    )
    email = models.EmailField("E-mail", blank=True, null=True)
    phone = models.CharField("Telefone", max_length=20, blank=True, null=True)
    is_active = models.BooleanField("Ativa", default=True, db_index=True)
    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="companies_created",
        verbose_name="Criado por",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="companies_updated",
        verbose_name="Atualizado por",
    )

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ["name"]

    def __str__(self):
        return self.name


class CustomUser(AbstractUser):
    PROFILE_TYPE_CHOICES = [
        ("interno", "Interno"),
        ("externo", "Externo"),
    ]

    email = models.EmailField("E-mail", unique=True, db_index=True)
    profile_type = models.CharField(
        "Tipo de Perfil",
        max_length=10,
        choices=PROFILE_TYPE_CHOICES,
        default="interno",
        db_index=True,
        help_text="Define se o usuário é interno ou externo à organização",
    )
    companies = models.ManyToManyField(
        Company, related_name="users", verbose_name="Empresas", blank=True
    )
    phone = models.CharField("Telefone", max_length=20, blank=True, null=True)
    cpf = models.CharField(
        "CPF",
        max_length=14,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
        validators=[
            RegexValidator(
                regex=r"^\d{3}\.\d{3}\.\d{3}-\d{2}$",
                message="CPF deve estar no formato: 000.000.000-00",
            )
        ],
        help_text="CPF do usuário (Formato: 000.000.000-00)",
    )
    is_active = models.BooleanField("Ativo", default=True, db_index=True)
    reset_password_token = models.CharField(
        "Token de Redefinição", max_length=100, blank=True, null=True, db_index=True
    )
    reset_password_token_expires = models.DateTimeField(
        "Token Expira em", blank=True, null=True
    )
    must_change_password = models.BooleanField("Deve alterar senha", default=False)
    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)
    created_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users_created",
        verbose_name="Criado por",
    )
    updated_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users_updated",
        verbose_name="Atualizado por",
    )

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
        ordering = ["username"]
        indexes = [
            models.Index(fields=["email"], name="user_email_idx"),
            models.Index(
                fields=["is_active", "profile_type"], name="user_active_profile_idx"
            ),
        ]

    def __str__(self):
        return f"{self.get_full_name() or self.username}"

    def generate_reset_token(self):
        """
        Gera um token seguro para redefinição de senha.
        Token expira em 24 horas.
        """
        self.reset_password_token = secrets.token_urlsafe(32)
        from datetime import timedelta

        from django.utils import timezone

        self.reset_password_token_expires = timezone.now() + timedelta(hours=24)
        self.save()
        return self.reset_password_token

    @staticmethod
    def generate_temporary_password():
        """Gera uma senha temporária segura de 12 caracteres."""
        return get_random_string(12)


class InternalProfile(models.Model):
    """Perfil para usuários internos da organização"""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="internal_profile",
        verbose_name="Usuário",
        limit_choices_to={"profile_type": "interno"},
    )
    department = models.CharField(
        "Departamento",
        max_length=100,
        blank=True,
        null=True,
        help_text="Departamento do usuário interno",
    )
    position = models.CharField(
        "Cargo",
        max_length=100,
        blank=True,
        null=True,
        help_text="Cargo do usuário na organização",
    )
    employee_id = models.CharField(
        "Matrícula",
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        help_text="Número de matrícula do funcionário",
    )
    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Perfil Interno"
        verbose_name_plural = "Perfis Internos"
        ordering = ["user__username"]

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.department or 'Sem departamento'}"


class ExternalProfile(models.Model):
    """Perfil para usuários externos (operadores, agências, clientes)"""

    EXTERNAL_TYPE_CHOICES = [
        ("operador", "Operador"),
        ("agencia", "Agência"),
        ("cliente", "Cliente"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="external_profile",
        verbose_name="Usuário",
        limit_choices_to={"profile_type": "externo"},
    )
    company_name = models.CharField(
        "Nome da Empresa",
        max_length=200,
        help_text="Nome da empresa do usuário externo",
    )
    external_type = models.CharField(
        "Tipo",
        max_length=20,
        choices=EXTERNAL_TYPE_CHOICES,
        help_text="Tipo de usuário externo",
    )
    cnpj = models.CharField(
        "CNPJ",
        max_length=18,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$",
                message="CNPJ deve estar no formato: 00.000.000/0000-00",
            )
        ],
        help_text="CNPJ da empresa (Formato: 00.000.000/0000-00)",
    )
    contact_person = models.CharField(
        "Pessoa de Contato",
        max_length=200,
        blank=True,
        null=True,
        help_text="Nome da pessoa de contato na empresa",
    )
    notes = models.TextField(
        "Observações",
        blank=True,
        null=True,
        help_text="Observações adicionais sobre o perfil externo",
    )
    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Perfil Externo"
        verbose_name_plural = "Perfis Externos"
        ordering = ["company_name"]

    def __str__(self):
        return f"{self.company_name} ({self.get_external_type_display()})"
