from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class DataImportProcess(models.Model):
    """
    Model to track data import processes from external endpoints
    """

    STATUS_CHOICES = [
        ("active", "Ativo"),
        ("inactive", "Inativo"),
    ]

    table_name = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,  # Already unique, but explicit index for searches
        verbose_name="Nome da Tabela",
        help_text="Nome da tabela criada no banco de dados",
    )
    endpoint_url = models.URLField(
        max_length=500,
        verbose_name="URL do Endpoint",
        help_text="URL do endpoint externo de onde os dados foram importados",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
        db_index=True,  # Indexed for filtering by status
        verbose_name="Status",
    )
    record_count = models.IntegerField(
        default=0,
        verbose_name="Quantidade de Registros",
        help_text="Número de registros importados",
    )
    column_structure = models.JSONField(
        default=dict,
        verbose_name="Estrutura das Colunas",
        help_text="Estrutura JSON das colunas criadas",
    )
    error_message = models.TextField(
        blank=True, null=True, verbose_name="Mensagem de Erro"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="data_imports",
        verbose_name="Criado por",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")

    class Meta:
        verbose_name = "Processo de Importação"
        verbose_name_plural = "Processos de Importação"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["status", "created_at"], name="process_status_created_idx"
            ),
            models.Index(
                fields=["created_by", "status"], name="process_user_status_idx"
            ),
        ]

    def __str__(self):
        return f"{self.table_name} - {self.get_status_display()}"


class ImportedDataRecord(models.Model):
    """
    Model to store imported data records using JSONField
    This replaces the anti-pattern of creating dynamic tables
    """

    process = models.ForeignKey(
        DataImportProcess,
        on_delete=models.CASCADE,
        related_name="records",
        verbose_name="Processo de Importação",
    )
    data = models.JSONField(
        verbose_name="Dados", help_text="Dados do registro em formato JSON"
    )
    row_hash = models.CharField(
        max_length=64,
        db_index=True,
        verbose_name="Hash do Registro",
        help_text="Hash MD5 dos dados para detecção de duplicatas",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")

    class Meta:
        verbose_name = "Registro Importado"
        verbose_name_plural = "Registros Importados"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["process", "row_hash"]),
            models.Index(fields=["process", "created_at"]),
        ]
        # Ensure no duplicate records per process
        unique_together = [["process", "row_hash"]]

    def __str__(self):
        return f"Registro {self.id} - {self.process.table_name}"

    @staticmethod
    def generate_row_hash(data: dict) -> str:
        """
        Generate MD5 hash of data for duplicate detection
        """
        import hashlib
        import json

        # Sort keys to ensure consistent hashing
        data_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
        return hashlib.md5(data_str.encode()).hexdigest()


class AsyncTask(models.Model):
    """
    Model to track async Celery task status
    """

    TASK_STATUS_CHOICES = [
        ("pending", "Pendente"),
        ("started", "Iniciado"),
        ("progress", "Em Progresso"),
        ("success", "Conclu\u00eddo com Sucesso"),
        ("failed", "Falhou"),
        ("retrying", "Tentando Novamente"),
    ]

    task_id = models.CharField(
        max_length=255, unique=True, db_index=True, verbose_name="ID da Task Celery"
    )
    task_name = models.CharField(max_length=255, verbose_name="Nome da Task")
    status = models.CharField(
        max_length=20,
        choices=TASK_STATUS_CHOICES,
        default="pending",
        db_index=True,
        verbose_name="Status",
    )
    process = models.ForeignKey(
        DataImportProcess,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="async_tasks",
        verbose_name="Processo Relacionado",
    )
    progress = models.IntegerField(
        default=0,
        verbose_name="Progresso (%)",
        help_text="Progresso da task de 0 a 100",
    )
    result = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Resultado",
        help_text="Resultado da task em formato JSON",
    )
    error = models.TextField(null=True, blank=True, verbose_name="Mensagem de Erro")
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="async_tasks",
        verbose_name="Criado por",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Data de Cria\u00e7\u00e3o"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Data de Atualiza\u00e7\u00e3o"
    )
    completed_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Data de Conclus\u00e3o"
    )

    class Meta:
        verbose_name = "Task Ass\u00edncrona"
        verbose_name_plural = "Tasks Ass\u00edncronas"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["task_id", "status"]),
            models.Index(fields=["created_by", "status"]),
        ]

    def __str__(self):
        return f"{self.task_name} - {self.get_status_display()}"
