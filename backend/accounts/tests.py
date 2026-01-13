"""
Suite completo de testes para aplicação accounts.
Testa autenticação, gerenciamento de usuários, redefinição de senha e autorização.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Company, CustomUser, ExternalProfile, InternalProfile
from .serializers import (
    ChangePasswordSerializer,
    CompanySerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserSerializer,
)

User = get_user_model()


class CompanyModelTest(TestCase):
    """Testes para model Company."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@test.com", password="testpass123"
        )

    def test_create_company(self):
        company = Company.objects.create(
            name="Test Company",
            cnpj="12.345.678/0001-90",
            email="company@test.com",
            phone="(11) 1234-5678",
            created_by=self.user,
        )
        self.assertEqual(company.name, "Test Company")
        self.assertEqual(company.cnpj, "12.345.678/0001-90")
        self.assertTrue(company.is_active)
        self.assertEqual(str(company), "Test Company")

    def test_company_ordering(self):
        Company.objects.create(name="Zebra Company", cnpj="11.111.111/0001-11")
        Company.objects.create(name="Alpha Company", cnpj="22.222.222/0001-22")

        companies = Company.objects.all()
        self.assertEqual(companies[0].name, "Alpha Company")
        self.assertEqual(companies[1].name, "Zebra Company")


class CustomUserModelTest(TestCase):
    """Testes para model CustomUser."""

    def test_create_user(self):
        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.check_password("testpass123"))
        self.assertTrue(user.is_active)
        self.assertEqual(user.profile_type, "interno")
        self.assertFalse(user.must_change_password)

    def test_user_str_representation(self):
        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            first_name="John",
            last_name="Doe",
        )
        self.assertEqual(str(user), "John Doe")

        user2 = User.objects.create_user(
            username="noname", email="noname@example.com", password="testpass123"
        )
        self.assertEqual(str(user2), "noname")

    def test_generate_reset_token(self):
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        token = user.generate_reset_token()

        self.assertIsNotNone(token)
        self.assertIsNotNone(user.reset_password_token)
        self.assertIsNotNone(user.reset_password_token_expires)

        time_diff = user.reset_password_token_expires - timezone.now()
        self.assertAlmostEqual(time_diff.total_seconds(), 24 * 3600, delta=10)

    def test_generate_temporary_password(self):
        password = User.generate_temporary_password()

        self.assertIsNotNone(password)
        self.assertEqual(len(password), 12)

    def test_user_with_companies(self):
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        company1 = Company.objects.create(name="Company 1", cnpj="11.111.111/0001-11")
        company2 = Company.objects.create(name="Company 2", cnpj="22.222.222/0001-22")

        user.companies.add(company1, company2)

        self.assertEqual(user.companies.count(), 2)
        self.assertIn(company1, user.companies.all())
        self.assertIn(company2, user.companies.all())


class InternalProfileModelTest(TestCase):
    """Testes para model InternalProfile."""

    def test_create_internal_profile(self):
        user = User.objects.create_user(
            username="internal",
            email="internal@example.com",
            password="testpass123",
            profile_type="interno",
        )

        profile = InternalProfile.objects.create(
            user=user, department="TI", position="Desenvolvedor", employee_id="EMP001"
        )

        self.assertEqual(profile.user, user)
        self.assertEqual(profile.department, "TI")
        self.assertEqual(profile.position, "Desenvolvedor")
        self.assertEqual(profile.employee_id, "EMP001")


class ExternalProfileModelTest(TestCase):
    """Testes para model ExternalProfile."""

    def test_create_external_profile(self):
        user = User.objects.create_user(
            username="external",
            email="external@example.com",
            password="testpass123",
            profile_type="externo",
        )

        profile = ExternalProfile.objects.create(
            user=user,
            company_name="External Company",
            external_type="cliente",
            cnpj="12.345.678/0001-90",
        )

        self.assertEqual(profile.user, user)
        self.assertEqual(profile.company_name, "External Company")
        self.assertEqual(profile.external_type, "cliente")
        self.assertEqual(profile.cnpj, "12.345.678/0001-90")


class UserSerializerTest(TestCase):
    """Testes para UserSerializer."""

    def test_create_user_with_temporary_password(self):
        serializer = UserSerializer(
            data={
                "username": "newuser",
                "email": "newuser@example.com",
                "first_name": "New",
                "last_name": "User",
            }
        )

        self.assertTrue(serializer.is_valid())
        user = serializer.save()

        self.assertEqual(user.username, "newuser")
        self.assertTrue(user.must_change_password)
        self.assertIsNotNone(user.reset_password_token)


class AuthenticationAPITest(APITestCase):
    """Testes para endpoints de autenticação."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )

    def test_login_with_email(self):
        url = "/api/auth/login"
        data = {"email": "test@example.com", "password": "testpass123"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "test@example.com")

    def test_login_with_wrong_password(self):
        url = "/api/auth/login"
        data = {"email": "test@example.com", "password": "wrongpassword"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_inactive_user(self):
        self.user.is_active = False
        self.user.save()

        url = "/api/auth/login"
        data = {"email": "test@example.com", "password": "testpass123"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout(self):
        refresh = RefreshToken.for_user(self.user)

        url = "/api/auth/logout"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        response = self.client.post(url, {"refresh": str(refresh)}, format="json")

        self.assertIn(
            response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
        )

    def test_get_current_user(self):
        refresh = RefreshToken.for_user(self.user)

        url = "/api/users/me/"
        self.client.credentials(HTTP_AUTHORIZATION="Bearer {refresh.access_token}")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "test@example.com")


class PasswordResetAPITest(APITestCase):
    """Testes para fluxo de redefinição de senha."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="oldpassword123"
        )

    def test_request_password_reset(self):
        url = "/api/users/request_password_reset/"
        data = {"email": "test@example.com"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.reset_password_token)

    def test_request_password_reset_nonexistent_email(self):
        url = "/api/users/request_password_reset/"
        data = {"email": "nonexistent@example.com"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reset_password_with_valid_token(self):
        token = self.user.generate_reset_token()

        url = "/api/users/reset_password/"
        data = {
            "token": token,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))
        self.assertIsNone(self.user.reset_password_token)
        self.assertFalse(self.user.must_change_password)

    def test_reset_password_with_expired_token(self):
        token = self.user.generate_reset_token()
        self.user.reset_password_token_expires = timezone.now() - timedelta(hours=1)
        self.user.save()

        url = "/api/users/reset_password/"
        data = {
            "token": token,
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password_with_invalid_token(self):
        url = "/api/users/reset_password/"
        data = {
            "token": "invalid-token-12345",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ChangePasswordAPITest(APITestCase):
    """Testes para endpoint de alteração de senha."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="oldpassword123"
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer {refresh.access_token}")

    def test_change_password_success(self):
        url = "/api/users/change_password/"
        data = {
            "old_password": "oldpassword123",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))
        self.assertFalse(self.user.must_change_password)

    def test_change_password_wrong_old_password(self):
        url = "/api/users/change_password/"
        data = {
            "old_password": "wrongpassword",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_mismatch(self):
        """Test password change with mismatched new passwords"""
        url = "/api/users/change_password/"
        data = {
            "old_password": "oldpassword123",
            "new_password": "newpassword123",
            "confirm_password": "differentpassword",
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_unauthenticated(self):
        self.client.credentials()

        url = "/api/users/change_password/"
        data = {
            "old_password": "oldpassword123",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CompanyAPITest(APITestCase):
    """Testes para endpoints de Company."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer {refresh.access_token}")

    def test_create_company_authenticated(self):
        url = "/api/companies/"
        data = {
            "name": "New Company",
            "cnpj": "12.345.678/0001-90",
            "email": "company@test.com",
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Company.objects.count(), 1)

    def test_list_companies_authenticated(self):
        Company.objects.create(name="Company 1", cnpj="11.111.111/0001-11")
        Company.objects.create(name="Company 2", cnpj="22.222.222/0001-22")

        url = "/api/companies/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = (
            response.data.get("results", response.data)
            if isinstance(response.data, dict)
            else response.data
        )
        self.assertEqual(len(data), 2)

    def test_company_api_requires_authentication(self):
        self.client.credentials()

        url = "/api/companies/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
