"""
Modelos para o assistente Alice com suporte a busca vetorial
"""

from django.db import models
from pgvector.django import VectorField


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
    embedding = VectorField(
        dimensions=768,  # Google Gemini models/embedding-001
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
