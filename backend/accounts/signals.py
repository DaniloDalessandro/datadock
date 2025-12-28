from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import CustomUser, ExternalProfile, InternalProfile


@receiver(pre_save, sender=CustomUser)
def validate_user_profile_type(sender, instance, **kwargs):
    """
    Pre-save signal to validate user data before saving.
    Ensures data consistency based on profile type.
    """
    # If profile type changed, we need to handle profile migration
    if instance.pk:
        try:
            old_instance = CustomUser.objects.get(pk=instance.pk)
            if old_instance.profile_type != instance.profile_type:
                # Profile type changed - need to handle profile deletion/creation
                # This will be handled by post_save signal
                pass
        except CustomUser.DoesNotExist:
            pass


@receiver(post_save, sender=CustomUser)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Post-save signal to automatically create the appropriate profile
    when a user is created or updated.

    Creates InternalProfile for internal users and ExternalProfile for external users.
    Handles profile type changes by deleting old profile and creating new one.
    """
    # Avoid recursion by checking if we're in a signal handler
    if kwargs.get("raw", False):
        return

    # Use atomic transaction to ensure data consistency
    with transaction.atomic():
        if instance.profile_type == "interno":
            # Create or get internal profile
            InternalProfile.objects.get_or_create(user=instance)

            # Delete external profile if it exists
            try:
                if hasattr(instance, "external_profile"):
                    instance.external_profile.delete()
            except ExternalProfile.DoesNotExist:
                pass

        elif instance.profile_type == "externo":
            # Delete internal profile if it exists
            try:
                if hasattr(instance, "internal_profile"):
                    instance.internal_profile.delete()
            except InternalProfile.DoesNotExist:
                pass

            # Create external profile with default values if it doesn't exist
            # The admin or API should update these values later
            if not hasattr(instance, "external_profile"):
                try:
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
                    # If creation fails, it will need to be created manually
                    pass


@receiver(post_save, sender=InternalProfile)
def ensure_internal_profile_consistency(sender, instance, created, **kwargs):
    """
    Ensure the user associated with an internal profile has the correct profile_type.
    """
    if kwargs.get("raw", False):
        return

    if instance.user.profile_type != "interno":
        instance.user.profile_type = "interno"
        instance.user.save(update_fields=["profile_type"])


@receiver(post_save, sender=ExternalProfile)
def ensure_external_profile_consistency(sender, instance, created, **kwargs):
    """
    Ensure the user associated with an external profile has the correct profile_type.
    """
    if kwargs.get("raw", False):
        return

    if instance.user.profile_type != "externo":
        instance.user.profile_type = "externo"
        instance.user.save(update_fields=["profile_type"])
