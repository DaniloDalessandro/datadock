"""
Tasks Celery para processamento assíncrono de importação de dados
"""

import logging

from celery import shared_task
from django.utils import timezone

from .cache import invalidate_process_caches
from .models import AsyncTask, DataImportProcess
from .services import DataImportService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_data_import_async(
    self, table_name, user_id, endpoint_url=None, file_path=None, import_type="endpoint"
):
    """
    Processa importação de dados de endpoint ou arquivo de forma assíncrona

    Args:
        table_name: Nome do dataset/tabela
        user_id: ID do usuário que iniciou a importação
        endpoint_url: URL para buscar dados (para importações de endpoint)
        file_path: Caminho do arquivo enviado (para importações de arquivo)
        import_type: 'endpoint' ou 'file'

    Returns:
        dict: Resultado da importação com ID do processo e estatísticas
    """
    task_id = self.request.id
    async_task = None

    try:
        logger.info("Starting async import for table: {table_name}")

        from django.contrib.auth import get_user_model

        User = get_user_model()
        user = User.objects.get(id=user_id)

        async_task = AsyncTask.objects.create(
            task_id=task_id, task_name="Data Import", status="started", created_by=user
        )

        process, created = DataImportProcess.objects.get_or_create(
            table_name=table_name,
            defaults={
                "endpoint_url": endpoint_url or "",
                "created_by": user,
                "status": "active",
            },
        )

        if import_type == "endpoint" and endpoint_url:
            data, column_structure = DataImportService.fetch_data_from_endpoint(
                endpoint_url
            )
            process.endpoint_url = endpoint_url
        elif import_type == "file" and file_path:
            data, column_structure = DataImportService.process_file_data_from_path(
                file_path
            )
        else:
            raise ValueError("Invalid import type or missing data source")

        process.column_structure = column_structure
        process.save()

        insert_stats = DataImportService.insert_data_orm(
            process, data, column_structure
        )

        async_task.process = process
        async_task.progress = 50
        async_task.save()

        process.record_count = insert_stats["inserted"]
        process.error_message = None
        process.save()

        invalidate_process_caches(process.id)

        async_task.status = "success"
        async_task.progress = 100
        async_task.result = insert_stats
        async_task.completed_at = timezone.now()
        async_task.save()

        logger.info(f"Async import completed for {table_name}: {insert_stats}")

        return {
            "success": True,
            "process_id": process.id,
            "task_id": task_id,
            "table_name": table_name,
            "statistics": insert_stats,
        }

    except Exception as e:
        logger.error("Error in async import for {table_name}: {str(e)}", exc_info=True)

        if async_task:
            async_task.status = (
                "failed" if self.request.retries >= self.max_retries else "retrying"
            )
            async_task.error = str(e)
            async_task.save()

        try:
            process = DataImportProcess.objects.get(table_name=table_name)
            process.error_message = str(e)
            process.save()
        except Exception:
            pass

        # Retry com exponential backoff
        raise self.retry(exc=e, countdown=60 * (2**self.request.retries))


@shared_task(bind=True)
def append_data_async(
    self, process_id, file_path=None, endpoint_url=None, import_type="file"
):
    """
    Adiciona dados a um dataset existente de forma assíncrona

    Args:
        process_id: ID do DataImportProcess
        file_path: Caminho do arquivo enviado
        endpoint_url: URL para buscar dados
        import_type: 'endpoint' ou 'file'

    Returns:
        dict: Resultado da adição com estatísticas
    """
    try:
        logger.info("Starting async append for process: {process_id}")

        process = DataImportProcess.objects.get(id=process_id)

        if import_type == "endpoint" and endpoint_url:
            data, column_structure = DataImportService.fetch_data_from_endpoint(
                endpoint_url
            )
        elif import_type == "file" and file_path:
            data, column_structure = DataImportService.process_file_data_from_path(
                file_path
            )
        else:
            raise ValueError("Invalid import type or missing data source")

        insert_stats = DataImportService.insert_data_orm(
            process, data, process.column_structure
        )

        process.record_count += insert_stats["inserted"]
        process.save()

        logger.info(f"Async append completed for process {process_id}: {insert_stats}")

        return {"success": True, "process_id": process_id, "statistics": insert_stats}

    except Exception as e:
        logger.error(
            "Error in async append for process {process_id}: {str(e)}", exc_info=True
        )
        # Retry com exponential backoff
        raise self.retry(exc=e, countdown=60 * (2**self.request.retries))
