from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html

from .models import CustomUser, ExternalProfile, InternalProfile


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = [
        "username",
        "name_display",
        "email",
        "cpf",
        "profile_type_display",
        "is_active_display",
        "is_staff",
        "created_by",
    ]
    list_filter = ["is_active", "is_staff", "is_superuser", "companies", "created_by"]
    search_fields = ["username", "email", "first_name", "last_name", "cpf"]
    ordering = ["username"]
    filter_horizontal = ["companies", "groups", "user_permissions"]
    readonly_fields = [
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
        "last_login",
        "date_joined",
    ]

    fieldsets = (
        ("🔐 Credenciais", {"fields": ("username", "password")}),
        (
            "👤 Informações Pessoais",
            {"fields": ("first_name", "last_name", "email", "cpf", "phone")},
        ),
        ("🏢 Empresas", {"fields": ("companies",)}),
        (
            "⚙️ Permissões",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "📅 Auditoria",
            {
                "fields": (
                    "last_login",
                    "date_joined",
                    "created_at",
                    "created_by",
                    "updated_at",
                    "updated_by",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def name_display(self, obj):
        """Exibe nome completo formatado"""
        full_name = obj.get_full_name()
        if full_name:
            return format_html("<strong>{}</strong>", full_name)
        return "-"

    name_display.short_description = "Nome Completo"

    def profile_type_display(self, obj):
        """Exibe tipo de perfil com badge colorido"""
        try:
            if hasattr(obj, "internal_profile"):
                return format_html(
                    '<span style="background-color: #28a745; color: white; padding: 3px 8px; '
                    'border-radius: 3px; font-size: 10px; font-weight: bold;">🏢 INTERNO</span>'
                )
            elif hasattr(obj, "external_profile"):
                return format_html(
                    '<span style="background-color: #17a2b8; color: white; padding: 3px 8px; '
                    'border-radius: 3px; font-size: 10px; font-weight: bold;">🌐 EXTERNO</span>'
                )
        except (AttributeError, Exception):
            pass
        return format_html(
            '<span style="background-color: #6c757d; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 10px; font-weight: bold;">❓ SEM PERFIL</span>'
        )

    profile_type_display.short_description = "Tipo de Perfil"

    def is_active_display(self, obj):
        """Exibe status ativo/inativo com badge colorido"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 3px 10px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">✓ ATIVO</span>'
            )
        return format_html(
            '<span style="background-color: #dc3545; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">✗ INATIVO</span>'
        )

    is_active_display.short_description = "Status"

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "password1",
                    "password2",
                    "email",
                    "first_name",
                    "last_name",
                    "cpf",
                    "phone",
                    "companies",
                ),
            },
        ),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(InternalProfile)
class InternalProfileAdmin(admin.ModelAdmin):
    list_display = [
        "user_display",
        "department",
        "position",
        "employee_id",
        "created_at",
    ]
    list_filter = ["department", "created_at"]
    search_fields = [
        "user__username",
        "user__email",
        "employee_id",
        "department",
        "position",
    ]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("👤 Usuário", {"fields": ("user",)}),
        (
            "💼 Informações Profissionais",
            {"fields": ("department", "position", "employee_id")},
        ),
        (
            "📅 Datas",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def user_display(self, obj):
        """Exibe usuário com badge de perfil interno"""
        full_name = obj.user.get_full_name() or obj.user.username
        return format_html(
            '<span style="background-color: #28a745; color: white; padding: 2px 6px; '
            'border-radius: 3px; font-size: 10px; margin-right: 5px;">🏢</span> {}',
            full_name,
        )

    user_display.short_description = "Usuário"


@admin.register(ExternalProfile)
class ExternalProfileAdmin(admin.ModelAdmin):
    list_display = [
        "user_display",
        "company_name",
        "external_type_display",
        "cnpj",
        "created_at",
    ]
    list_filter = ["external_type", "created_at"]
    search_fields = ["user__username", "user__email", "company_name", "cnpj"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("👤 Usuário", {"fields": ("user",)}),
        (
            "🏢 Informações da Empresa",
            {"fields": ("company_name", "cnpj", "external_type")},
        ),
        (
            "📅 Datas",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def user_display(self, obj):
        """Exibe usuário com badge de perfil externo"""
        full_name = obj.user.get_full_name() or obj.user.username
        return format_html(
            '<span style="background-color: #17a2b8; color: white; padding: 2px 6px; '
            'border-radius: 3px; font-size: 10px; margin-right: 5px;">🌐</span> {}',
            full_name,
        )

    user_display.short_description = "Usuário"

    def external_type_display(self, obj):
        """Exibe tipo externo com badge colorido"""
        colors = {
            "cliente": "#007bff",
            "fornecedor": "#28a745",
            "parceiro": "#ffc107",
            "outro": "#6c757d",
        }
        color = colors.get(obj.external_type.lower(), "#6c757d")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 10px; font-weight: bold;">{}</span>',
            color,
            obj.external_type.upper(),
        )

    external_type_display.short_description = "Tipo"
