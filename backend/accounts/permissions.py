from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permite apenas administradores modificarem dados.
    Usuários autenticados podem apenas ler.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permite que usuários acessem apenas seus próprios dados.
    Administradores podem acessar tudo.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.is_superuser:
            return True

        # Verifica se o objeto é o próprio usuário
        if hasattr(obj, "id") and hasattr(request.user, "id"):
            return obj.id == request.user.id

        return False


class CanManageUsers(permissions.BasePermission):
    """
    Permite apenas staff ou superusuários gerenciarem usuários.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and (request.user.is_staff or request.user.is_superuser)


class CanManageCompanies(permissions.BasePermission):
    """
    Permite apenas staff ou superusuários gerenciarem empresas.
    Usuários normais podem apenas listar empresas às quais pertencem.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and (request.user.is_staff or request.user.is_superuser)

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.is_superuser:
            return True

        # Usuários podem visualizar empresas às quais pertencem
        if request.method in permissions.SAFE_METHODS:
            return obj in request.user.companies.all()

        return False


class IsInternalUser(permissions.BasePermission):
    """
    Permite acesso apenas para usuários internos.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.profile_type == "interno"
        )


class IsExternalUser(permissions.BasePermission):
    """
    Permite acesso apenas para usuários externos.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.profile_type == "externo"
        )
