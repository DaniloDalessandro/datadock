"""
Permissões customizadas para o módulo data_import
"""

from rest_framework import permissions


class IsDatasetOwnerOrReadOnly(permissions.BasePermission):
    """
    Permissão customizada que permite apenas aos proprietários de um dataset editá-lo ou deletá-lo.
    Operações de leitura são permitidas para todos os usuários autenticados.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.created_by == request.user or request.user.is_superuser


class IsDatasetOwner(permissions.BasePermission):
    """
    Permissão customizada que permite apenas aos proprietários de um dataset acessá-lo.
    """

    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user or request.user.is_superuser


class CanManageDatasets(permissions.BasePermission):
    """
    Permissão para verificar se usuário pode gerenciar datasets (criar, modificar, deletar).
    Superusuários e usuários no grupo 'Dataset Managers' podem gerenciar datasets.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.groups.filter(name="Dataset Managers").exists()


class CanDeleteDatasets(permissions.BasePermission):
    """
    Permissão para deletar datasets.
    Apenas superusuários ou proprietários do dataset podem deletar.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user or request.user.is_superuser


class IsInternalUser(permissions.BasePermission):
    """
    Permissão que permite apenas usuários internos acessarem.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile_type == "interno"


class IsExternalUser(permissions.BasePermission):
    """
    Permissão que permite apenas usuários externos acessarem.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile_type == "externo"
