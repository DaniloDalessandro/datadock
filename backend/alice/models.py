"""
Modelos para o assistente Alice com suporte a busca vetorial
"""

from django.db import models

from alice.fields import AdaptiveVectorField


class DatasetEmbedding(models.Model):
    """
    Armazena embeddings de datasets para busca semântica com RAG
    """

    dataset = models.OneToOneField(
        "data_import.DataImportProcess",
        on_delete=models.CASCADE,
        related_name="embedding",
        verbose_name="Dataset",
    )
    description = models.TextField(
        verbose_name="Descrição",
        help_text="Descrição textual do dataset para geração de embedding",
    )
    embedding = AdaptiveVectorField(
        dimensions=768,
        verbose_name="Embedding Vetorial",
    )
    metadata = models.JSONField(
        default=dict,
        verbose_name="Metadados",
        help_text="Informações adicionais sobre o dataset",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        verbose_name = "Embedding de Dataset"
        verbose_name_plural = "Embeddings de Datasets"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["dataset"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Embedding: {self.dataset.table_name}"


class ConversationSession(models.Model):
    """Sessão de conversa com o agente Alice"""

    session_id = models.UUIDField(unique=True, db_index=True)
    user = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        related_name="alice_sessions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Sessão de Conversa"
        verbose_name_plural = "Sessões de Conversa"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Sessão {self.session_id} — {self.user}"


class ConversationMessage(models.Model):
    """Mensagem de uma conversa com o agente"""

    ROLE_CHOICES = [("human", "Usuário"), ("ai", "Alice")]

    session = models.ForeignKey(
        ConversationSession,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    steps = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Mensagem"
        verbose_name_plural = "Mensagens"
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.role}] {self.content[:60]}"
