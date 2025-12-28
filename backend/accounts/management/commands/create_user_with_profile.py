"""
Management command to create users with profiles easily.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import CustomUser, ExternalProfile, InternalProfile


class Command(BaseCommand):
    help = "Create a user with a profile (internal or external)"

    def add_arguments(self, parser):
        parser.add_argument("username", type=str, help="Username for the new user")
        parser.add_argument("email", type=str, help="Email for the new user")
        parser.add_argument(
            "--password", type=str, help="Password (if not provided, will be generated)"
        )
        parser.add_argument("--first-name", type=str, help="First name")
        parser.add_argument("--last-name", type=str, help="Last name")
        parser.add_argument(
            "--profile-type",
            type=str,
            choices=["interno", "externo"],
            default="interno",
            help="Profile type (interno or externo)",
        )
        parser.add_argument("--staff", action="store_true", help="Make user staff")
        parser.add_argument(
            "--superuser", action="store_true", help="Make user superuser"
        )

        # Internal profile options
        parser.add_argument(
            "--department", type=str, help="Department (for internal users)"
        )
        parser.add_argument(
            "--position", type=str, help="Position (for internal users)"
        )
        parser.add_argument(
            "--employee-id", type=str, help="Employee ID (for internal users)"
        )

        # External profile options
        parser.add_argument(
            "--company-name", type=str, help="Company name (for external users)"
        )
        parser.add_argument(
            "--external-type",
            type=str,
            choices=["operador", "agencia", "cliente"],
            help="External type (operador, agencia, or cliente)",
        )
        parser.add_argument("--cnpj", type=str, help="CNPJ (for external users)")
        parser.add_argument(
            "--contact-person", type=str, help="Contact person (for external users)"
        )

    def handle(self, *args, **options):
        username = options["username"]
        email = options["email"]
        password = options.get("password") or CustomUser.generate_temporary_password()
        first_name = options.get("first_name", "")
        last_name = options.get("last_name", "")
        profile_type = options["profile_type"]

        # Validate external profile requirements
        if profile_type == "externo":
            if not options.get("company_name"):
                raise CommandError("--company-name is required for external users")
            if not options.get("external_type"):
                raise CommandError("--external-type is required for external users")

        try:
            with transaction.atomic():
                # Create user
                if options["superuser"]:
                    user = CustomUser.objects.create_superuser(
                        username=username,
                        email=email,
                        password=password,
                        first_name=first_name,
                        last_name=last_name,
                        profile_type=profile_type,
                    )
                else:
                    user = CustomUser.objects.create_user(
                        username=username,
                        email=email,
                        password=password,
                        first_name=first_name,
                        last_name=last_name,
                        profile_type=profile_type,
                        is_staff=options.get("staff", False),
                    )

                self.stdout.write(
                    self.style.SUCCESS(f'User "{username}" created successfully')
                )
                self.stdout.write(f"  Email: {email}")
                self.stdout.write(f"  Profile Type: {user.get_profile_type_display()}")
                self.stdout.write(f"  Password: {password}")

                # Create profile based on type
                if profile_type == "interno":
                    profile, created = InternalProfile.objects.get_or_create(user=user)
                    if options.get("department"):
                        profile.department = options["department"]
                    if options.get("position"):
                        profile.position = options["position"]
                    if options.get("employee_id"):
                        profile.employee_id = options["employee_id"]
                    profile.save()

                    self.stdout.write(
                        self.style.SUCCESS("Internal profile created/updated")
                    )
                    if profile.department:
                        self.stdout.write(f"  Department: {profile.department}")
                    if profile.position:
                        self.stdout.write(f"  Position: {profile.position}")
                    if profile.employee_id:
                        self.stdout.write(f"  Employee ID: {profile.employee_id}")

                elif profile_type == "externo":
                    profile = ExternalProfile.objects.create(
                        user=user,
                        company_name=options["company_name"],
                        external_type=options["external_type"],
                        cnpj=options.get("cnpj", ""),
                        contact_person=options.get("contact_person", ""),
                    )

                    self.stdout.write(self.style.SUCCESS("External profile created"))
                    self.stdout.write(f"  Company: {profile.company_name}")
                    self.stdout.write(f"  Type: {profile.get_external_type_display()}")
                    if profile.cnpj:
                        self.stdout.write(f"  CNPJ: {profile.cnpj}")
                    if profile.contact_person:
                        self.stdout.write(f"  Contact: {profile.contact_person}")

        except Exception as e:
            raise CommandError(f"Error creating user: {str(e)}")
