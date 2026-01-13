"""Command de gerenciamento para criar dados de exemplo para testes."""

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Company, CustomUser, ExternalProfile, InternalProfile


class Command(BaseCommand):
    help = "Create sample data for testing the accounts system"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing sample data before creating new data",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing sample data...")
            CustomUser.objects.filter(username__startswith="demo_").delete()
            Company.objects.filter(name__startswith="Demo ").delete()
            self.stdout.write(self.style.SUCCESS("Sample data cleared"))

        self.stdout.write("Creating sample data...")

        try:
            with transaction.atomic():
                self.stdout.write("\n1. Creating companies...")
                company1, created = Company.objects.get_or_create(
                    cnpj="12.345.678/0001-90",
                    defaults={
                        "name": "Demo Operadora Portuaria Ltda",
                        "email": "contato@operadora.com",
                        "phone": "(11) 3333-4444",
                        "is_active": True,
                    },
                )
                action = "Created" if created else "Found existing"
                self.stdout.write(f"   [OK] {action}: {company1.name}")

                company2, created = Company.objects.get_or_create(
                    cnpj="98.765.432/0001-10",
                    defaults={
                        "name": "Demo Agencia de Navegacao SA",
                        "email": "contato@agencia.com",
                        "phone": "(21) 5555-6666",
                        "is_active": True,
                    },
                )
                action = "Created" if created else "Found existing"
                self.stdout.write(f"   [OK] {action}: {company2.name}")

                self.stdout.write("\n2. Creating admin user...")
                admin, created = CustomUser.objects.get_or_create(
                    username="demo_admin",
                    defaults={
                        "email": "admin@dataport.com",
                        "first_name": "Admin",
                        "last_name": "Sistema",
                        "profile_type": "interno",
                        "is_staff": True,
                        "is_superuser": True,
                    },
                )
                if created:
                    admin.set_password("admin123")
                    admin.save()
                    InternalProfile.objects.create(
                        user=admin,
                        department="TI",
                        position="Administrador do Sistema",
                        employee_id="ADM001",
                    )
                    action = "Created"
                else:
                    action = "Found existing"
                self.stdout.write(
                    f"   [OK] {action}: {admin.username} (password: admin123)"
                )

                self.stdout.write("\n3. Creating internal users...")

                internal1 = CustomUser.objects.create_user(
                    username="demo_joao",
                    email="joao.silva@dataport.com",
                    password="joao123",
                    first_name="João",
                    last_name="Silva",
                    cpf="123.456.789-00",
                    phone="(11) 9999-8888",
                    profile_type="interno",
                    is_staff=True,
                )
                InternalProfile.objects.create(
                    user=internal1,
                    department="Operações",
                    position="Supervisor",
                    employee_id="OPE001",
                )
                self.stdout.write(
                    f"   [OK] Created: {internal1.username} (password: joao123)"
                )

                internal2 = CustomUser.objects.create_user(
                    username="demo_maria",
                    email="maria.santos@dataport.com",
                    password="maria123",
                    first_name="Maria",
                    last_name="Santos",
                    cpf="987.654.321-00",
                    phone="(11) 8888-7777",
                    profile_type="interno",
                    is_staff=True,
                )
                InternalProfile.objects.create(
                    user=internal2,
                    department="Financeiro",
                    position="Analista",
                    employee_id="FIN001",
                )
                self.stdout.write(
                    f"   [OK] Created: {internal2.username} (password: maria123)"
                )

                self.stdout.write("\n4. Creating external users...")

                external1 = CustomUser.objects.create_user(
                    username="demo_operador",
                    email="operador@operadora.com",
                    password="operador123",
                    first_name="Carlos",
                    last_name="Operador",
                    cpf="111.222.333-44",
                    phone="(11) 7777-6666",
                    profile_type="externo",
                )
                ExternalProfile.objects.create(
                    user=external1,
                    company_name=company1.name,
                    external_type="operador",
                    cnpj="12.345.678/0001-90",
                    contact_person="Carlos Operador",
                )
                external1.companies.add(company1)
                self.stdout.write(
                    f"   [OK] Created: {external1.username} (password: operador123)"
                )

                external2 = CustomUser.objects.create_user(
                    username="demo_agencia",
                    email="agencia@agencia.com",
                    password="agencia123",
                    first_name="Ana",
                    last_name="Agência",
                    cpf="555.666.777-88",
                    phone="(21) 6666-5555",
                    profile_type="externo",
                )
                ExternalProfile.objects.create(
                    user=external2,
                    company_name=company2.name,
                    external_type="agencia",
                    cnpj="98.765.432/0001-10",
                    contact_person="Ana Agência",
                    notes="Representante da agência de navegação",
                )
                external2.companies.add(company2)
                self.stdout.write(
                    f"   [OK] Created: {external2.username} (password: agencia123)"
                )

                external3 = CustomUser.objects.create_user(
                    username="demo_cliente",
                    email="cliente@cliente.com",
                    password="cliente123",
                    first_name="Pedro",
                    last_name="Cliente",
                    cpf="999.888.777-66",
                    phone="(11) 5555-4444",
                    profile_type="externo",
                )
                ExternalProfile.objects.create(
                    user=external3,
                    company_name="Demo Cliente Importador Ltda",
                    external_type="cliente",
                    cnpj="11.222.333/0001-44",
                    contact_person="Pedro Cliente",
                    notes="Cliente importador de produtos diversos",
                )
                self.stdout.write(
                    f"   [OK] Created: {external3.username} (password: cliente123)"
                )

                self.stdout.write("\n" + "=" * 60)
                self.stdout.write(
                    self.style.SUCCESS("Sample data created successfully!")
                )
                self.stdout.write("=" * 60)
                self.stdout.write("\nSummary:")
                self.stdout.write(
                    f'  Companies: {Company.objects.filter(name__startswith="Demo ").count()}'
                )
                self.stdout.write(
                    f'  Users: {CustomUser.objects.filter(username__startswith="demo_").count()}'
                )
                self.stdout.write(
                    f'  Internal Profiles: {InternalProfile.objects.filter(user__username__startswith="demo_").count()}'
                )
                self.stdout.write(
                    f'  External Profiles: {ExternalProfile.objects.filter(user__username__startswith="demo_").count()}'
                )

                self.stdout.write("\nLogin credentials:")
                self.stdout.write("  Admin: demo_admin / admin123")
                self.stdout.write("  Internal 1: demo_joao / joao123")
                self.stdout.write("  Internal 2: demo_maria / maria123")
                self.stdout.write("  External Operador: demo_operador / operador123")
                self.stdout.write("  External Agencia: demo_agencia / agencia123")
                self.stdout.write("  External Cliente: demo_cliente / cliente123")
                self.stdout.write("\n" + "=" * 60)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error creating sample data: {str(e)}"))
            raise
