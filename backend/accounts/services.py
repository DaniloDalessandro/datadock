import logging
from typing import Optional, Tuple

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.html import strip_tags

User = get_user_model()
logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def send_temporary_password(user, temporary_password, reset_token):
        """Envia email com senha temporária e link de redefinição"""
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

        subject = "Bem-vindo ao Sistema - Senha Temporária"

        html_message = f"""
        <html>
        <body>
            <h2>Olá {user.get_full_name() or user.username}!</h2>
            <p>Sua conta foi criada com sucesso no sistema.</p>

            <h3>Dados de acesso:</h3>
            <p><strong>Usuário:</strong> {user.username}</p>
            <p><strong>Senha temporária:</strong> {temporary_password}</p>

            <p><strong>IMPORTANTE:</strong> Por segurança, você deve alterar sua senha no primeiro acesso.</p>

            <p>Clique no link abaixo para redefinir sua senha:</p>
            <p><a href="{reset_link}">Redefinir Senha</a></p>

            <p>Ou copie e cole este link no navegador:</p>
            <p>{reset_link}</p>

            <p>Este link expira em 24 horas.</p>

            <hr>
            <p style="color: #666; font-size: 12px;">
                Se você não solicitou esta conta, por favor ignore este email.
            </p>
        </body>
        </html>
        """

        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

    @staticmethod
    def send_password_reset_email(user, reset_token):
        """Envia email com link de redefinição de senha"""
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

        subject = "Redefinição de Senha"

        html_message = f"""
        <html>
        <body>
            <h2>Olá {user.get_full_name() or user.username}!</h2>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>

            <p>Clique no link abaixo para criar uma nova senha:</p>
            <p><a href="{reset_link}">Redefinir Senha</a></p>

            <p>Ou copie e cole este link no navegador:</p>
            <p>{reset_link}</p>

            <p>Este link expira em 24 horas.</p>

            <hr>
            <p style="color: #666; font-size: 12px;">
                Se você não solicitou a redefinição de senha, por favor ignore este email.
            </p>
        </body>
        </html>
        """

        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )


class UserService:
    """Camada de serviço para lógica de negócio relacionada a usuários"""

    @staticmethod
    def create_user_with_temporary_password(
        username: str, email: str, **extra_fields
    ) -> Tuple[User, str]:
        """
        Cria um usuário com senha temporária e envia email de boas-vindas.

        Args:
            username: Nome de usuário para o novo usuário
            email: Email para o novo usuário
            **extra_fields: Campos adicionais para criação do usuário

        Returns:
            Tupla de (instância User, string da senha temporária)
        """
        temporary_password = User.generate_temporary_password()

        user = User.objects.create_user(
            username=username, email=email, password=temporary_password, **extra_fields
        )

        user.must_change_password = True
        reset_token = user.generate_reset_token()
        user.save()

        try:
            EmailService.send_temporary_password(user, temporary_password, reset_token)
        except Exception as e:
            logger.warning(f"Failed to send welcome email to {email}: {str(e)}")

        return user, temporary_password

    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """
        Busca um usuário pelo endereço de email.

        Args:
            email: Email a ser buscado

        Returns:
            Instância User se encontrada, None caso contrário
        """
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None

    @staticmethod
    def request_password_reset(email: str) -> Optional[User]:
        """
        Inicia processo de redefinição de senha gerando token e enviando email.

        Args:
            email: Endereço de email do usuário solicitando redefinição

        Returns:
            None sempre (por segurança, mesma resposta independente se email existe)
        """
        user = UserService.get_user_by_email(email)

        if user:
            reset_token = user.generate_reset_token()
            user.save()

            try:
                EmailService.send_password_reset_email(user, reset_token)
            except Exception as e:
                logger.warning(
                    f"Failed to send password reset email to {email}: {str(e)}"
                )

        return None

    @staticmethod
    def reset_password_with_token(
        token: str, new_password: str
    ) -> Tuple[bool, Optional[str], Optional[User]]:
        """
        Redefine senha do usuário usando token de redefinição válido.

        Args:
            token: Token de redefinição de senha
            new_password: Nova senha a ser definida

        Returns:
            Tupla de (sucesso: bool, mensagem_erro: Optional[str], usuário: Optional[User])
        """
        try:
            user = User.objects.get(reset_password_token=token)
        except User.DoesNotExist:
            return False, "Token de redefinição inválido", None

        if user.reset_password_token_expires < timezone.now():
            return False, "Token de redefinição expirado", None

        user.set_password(new_password)
        user.must_change_password = False
        user.reset_password_token = None
        user.reset_password_token_expires = None
        user.save()

        return True, None, user

    @staticmethod
    def change_password(
        user: User, old_password: str, new_password: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Altera senha do usuário após validar a senha antiga.

        Args:
            user: Usuário cuja senha será alterada
            old_password: Senha atual para validação
            new_password: Nova senha a ser definida

        Returns:
            Tupla de (sucesso: bool, mensagem_erro: Optional[str])
        """
        if not user.check_password(old_password):
            return False, "Senha atual incorreta"

        user.set_password(new_password)
        user.must_change_password = False
        user.save()

        return True, None

    @staticmethod
    def validate_user_credentials(
        email: str, password: str
    ) -> Tuple[bool, Optional[User], Optional[str]]:
        """
        Valida credenciais do usuário para autenticação.

        Args:
            email: Endereço de email do usuário
            password: Senha do usuário

        Returns:
            Tupla de (válido: bool, usuário: Optional[User], mensagem_erro: Optional[str])
        """
        user = UserService.get_user_by_email(email)

        if not user:
            return False, None, "Credenciais inválidas"

        if not user.check_password(password):
            return False, None, "Credenciais inválidas"

        if not user.is_active:
            return False, None, "Usuário inativo"

        return True, user, None
