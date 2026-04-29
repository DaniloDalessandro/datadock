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

    def _ensure_user(self, username: str, password: str, defaults: dict):
        user, created = CustomUser.objects.get_or_create(
            username=username,
            defaults=defaults,
        )
        if created:
            user.set_password(password)
            user.save()
        return user, created

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
                admin, created = self._ensure_user(
                    username="demo_admin",
                    password="admin123",
                    defaults={
                        "email": "admin@datadock.com",
                        "first_name": "Admin",
                        "last_name": "Sistema",
                        "profile_type": "interno",
                        "is_staff": True,
                        "is_superuser": True,
                    },
                )
                InternalProfile.objects.update_or_create(
                    user=admin,
                    defaults={
                        "department": "TI",
                        "position": "Administrador do Sistema",
                        "employee_id": "ADM001",
                    },
                )
                self.stdout.write(
                    f"   [OK] {'Created' if created else 'Found existing'}: {admin.username} (password: admin123)"
                )

                self.stdout.write("\n3. Creating internal users...")
                internal1, created = self._ensure_user(
                    username="demo_joao",
                    password="joao123",
                    defaults={
                        "email": "joao.silva@datadock.com",
                        "first_name": "Joao",
                        "last_name": "Silva",
                        "cpf": "123.456.789-00",
                        "phone": "(11) 9999-8888",
                        "profile_type": "interno",
                        "is_staff": True,
                    },
                )
                InternalProfile.objects.update_or_create(
                    user=internal1,
                    defaults={
                        "department": "Operacoes",
                        "position": "Supervisor",
                        "employee_id": "OPE001",
                    },
                )
                self.stdout.write(
                    f"   [OK] {'Created' if created else 'Found existing'}: {internal1.username} (password: joao123)"
                )

                internal2, created = self._ensure_user(
                    username="demo_maria",
                    password="maria123",
                    defaults={
                        "email": "maria.santos@datadock.com",
                        "first_name": "Maria",
                        "last_name": "Santos",
                        "cpf": "987.654.321-00",
                        "phone": "(11) 8888-7777",
                        "profile_type": "interno",
                        "is_staff": True,
                    },
                )
                InternalProfile.objects.update_or_create(
                    user=internal2,
                    defaults={
                        "department": "Financeiro",
                        "position": "Analista",
                        "employee_id": "FIN001",
                    },
                )
                self.stdout.write(
                    f"   [OK] {'Created' if created else 'Found existing'}: {internal2.username} (password: maria123)"
                )

                self.stdout.write("\n4. Creating external users...")
                external1, created = self._ensure_user(
                    username="demo_operador",
                    password="operador123",
                    defaults={
                        "email": "operador@operadora.com",
                        "first_name": "Carlos",
                        "last_name": "Operador",
                        "cpf": "111.222.333-44",
                        "phone": "(11) 7777-6666",
                        "profile_type": "externo",
                    },
                )
                ExternalProfile.objects.update_or_create(
                    user=external1,
                    defaults={
                        "company_name": company1.name,
                        "external_type": "operador",
                        "cnpj": "12.345.678/0001-90",
                        "contact_person": "Carlos Operador",
                    },
                )
                external1.companies.add(company1)
                self.stdout.write(
                    f"   [OK] {'Created' if created else 'Found existing'}: {external1.username} (password: operador123)"
                )

                external2, created = self._ensure_user(
                    username="demo_agencia",
                    password="agencia123",
                    defaults={
                        "email": "agencia@agencia.com",
                        "first_name": "Ana",
                        "last_name": "Agencia",
                        "cpf": "555.666.777-88",
                        "phone": "(21) 6666-5555",
                        "profile_type": "externo",
                    },
                )
                ExternalProfile.objects.update_or_create(
                    user=external2,
                    defaults={
                        "company_name": company2.name,
                        "external_type": "agencia",
                        "cnpj": "98.765.432/0001-10",
                        "contact_person": "Ana Agencia",
                        "notes": "Representante da agencia de navegacao",
                    },
                )
                external2.companies.add(company2)
                self.stdout.write(
                    f"   [OK] {'Created' if created else 'Found existing'}: {external2.username} (password: agencia123)"
                )

                external3, created = self._ensure_user(
                    username="demo_cliente",
                    password="cliente123",
                    defaults={
                        "email": "cliente@cliente.com",
                        "first_name": "Pedro",
                        "last_name": "Cliente",
                        "cpf": "999.888.777-66",
                        "phone": "(11) 5555-4444",
                        "profile_type": "externo",
                    },
                )
                ExternalProfile.objects.update_or_create(
                    user=external3,
                    defaults={
                        "company_name": "Demo Cliente Importador Ltda",
                        "external_type": "cliente",
                        "cnpj": "11.222.333/0001-44",
                        "contact_person": "Pedro Cliente",
                        "notes": "Cliente importador de produtos diversos",
                    },
                )
                self.stdout.write(
                    f"   [OK] {'Created' if created else 'Found existing'}: {external3.username} (password: cliente123)"
                )

                self.stdout.write("\n" + "=" * 60)
                self.stdout.write(self.style.SUCCESS("Sample data created successfully!"))
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

