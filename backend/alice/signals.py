"""
Signals para auto-indexação de datasets no banco vetorial
"""

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from alice.services import VectorService
from data_import.models import DataImportProcess

logger = logging.getLogger(__name__)


@receiver(post_save, sender=DataImportProcess)
def auto_index_dataset(sender, instance, created, **kwargs):
    """
    Indexa automaticamente o dataset no banco vetorial após ser salvo

    Args:
        sender: Modelo que enviou o signal
        instance: Instância do DataImportProcess
        created: True se o objeto foi criado, False se foi atualizado
        **kwargs: Argumentos adicionais do signal
    """
    # Só indexa se o processo foi completado
    if instance.status != "completed":
        return

    try:
        vector_service = VectorService()

        # Se foi criado, sempre indexa
        # Se foi atualizado, reindexar para manter sincronizado
        force = not created  # Força atualização se não for criação

        vector_service.index_dataset(instance, force=force)

        action = "indexado" if created else "reindexado"
        logger.info(f"Dataset {instance.table_name} {action} automaticamente")

    except Exception as e:
        # Não falha o processo principal se a indexação falhar
        logger.error(
            f"Erro ao indexar automaticamente dataset {instance.table_name}: {str(e)}"
        )
