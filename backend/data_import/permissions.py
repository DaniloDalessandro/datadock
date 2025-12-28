"""
Custom permissions for data_import app
"""

from rest_framework import permissions


class IsDatasetOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a dataset to edit/delete it.
    Read operations are allowed for all authenticated users.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner or superuser
        return obj.created_by == request.user or request.user.is_superuser


class IsDatasetOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a dataset to access it.
    """

    def has_object_permission(self, request, view, obj):
        # Only the owner or superuser can access
        return obj.created_by == request.user or request.user.is_superuser


class CanManageDatasets(permissions.BasePermission):
    """
    Permission to check if user can manage datasets (create, modify, delete).
    Superusers and users in 'Dataset Managers' group can manage datasets.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Superusers can always manage
        if request.user.is_superuser:
            return True

        # Check if user is in Dataset Managers group
        return request.user.groups.filter(name="Dataset Managers").exists()


class CanDeleteDatasets(permissions.BasePermission):
    """
    Permission for deleting datasets.
    Only superusers or dataset owners can delete.
    """

    def has_permission(self, request, view):
        # Must be authenticated
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Only owner or superuser can delete
        return obj.created_by == request.user or request.user.is_superuser


class IsInternalUser(permissions.BasePermission):
    """
    Permission that only allows internal users to access.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile_type == "interno"


class IsExternalUser(permissions.BasePermission):
    """
    Permission that only allows external users to access.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile_type == "externo"
