from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import CustomUser, ExternalProfile, InternalProfile


@receiver(pre_save, sender=CustomUser)
def validate_user_profile_type(sender, instance, **kwargs):
    """Valida dados do usuário antes de salvar e garante consistência baseada no tipo de perfil."""
    if instance.pk:
        try:
            old_instance = CustomUser.objects.get(pk=instance.pk)
            if old_instance.profile_type != instance.profile_type:
                pass
        except CustomUser.DoesNotExist:
            pass


@receiver(post_save, sender=CustomUser)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Cria automaticamente o perfil apropriado quando usuário é criado/atualizado.
    Cria InternalProfile para internos e ExternalProfile para externos.
    Gerencia mudanças de tipo deletando perfil antigo e criando novo.
    """
    if kwargs.get("raw", False):
        return

    with transaction.atomic():
        if instance.profile_type == "interno":
            InternalProfile.objects.get_or_create(user=instance)

            try:
                if hasattr(instance, "external_profile"):
                    instance.external_profile.delete()
            except ExternalProfile.DoesNotExist:
                pass

        elif instance.profile_type == "externo":
            try:
                if hasattr(instance, "internal_profile"):
                    instance.internal_profile.delete()
            except InternalProfile.DoesNotExist:
                pass

            if not hasattr(instance, "external_profile"):
                try:
                    # Cria com valores default, admin/API deve atualizar depois
                    ExternalProfile.objects.create(
                        user=instance,
                        company_name=(
                            instance.email.split("@")[1]
                            if instance.email
                            else "Empresa não informada"
                        ),
                        external_type="cliente",
                    )
                except Exception:
                    pass


@receiver(post_save, sender=InternalProfile)
def ensure_internal_profile_consistency(sender, instance, created, **kwargs):
    """Garante que usuário associado ao perfil interno tenha profile_type correto."""
    if kwargs.get("raw", False):
        return

    if instance.user.profile_type != "interno":
        instance.user.profile_type = "interno"
        instance.user.save(update_fields=["profile_type"])


@receiver(post_save, sender=ExternalProfile)
def ensure_external_profile_consistency(sender, instance, created, **kwargs):
    """Garante que usuário associado ao perfil externo tenha profile_type correto."""
    if kwargs.get("raw", False):
        return

    if instance.user.profile_type != "externo":
        instance.user.profile_type = "externo"
        instance.user.save(update_fields=["profile_type"])
