"""
Comando de gerenciamento para indexar datasets no banco vetorial usando LangChain + pgvector
"""

from django.core.management.base import BaseCommand

from alice.services import VectorService
from data_import.models import DataImportProcess


class Command(BaseCommand):
    help = "Indexa datasets existentes no banco vetorial para busca semântica (LangChain + pgvector)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="Indexa todos os datasets, incluindo os que já possuem embeddings",
        )
        parser.add_argument(
            "--dataset-id", type=int, help="ID de um dataset específico para indexar"
        )
        parser.add_argument(
            "--table-name",
            type=str,
            help="Nome da tabela de um dataset específico para indexar",
        )

    def handle(self, *args, **options):
        """Executa o comando de indexação."""
        import os

        gemini_key = os.getenv("GEMINI_API_KEY")
        if not gemini_key or gemini_key == "your-gemini-api-key-here":
            self.stdout.write(
                self.style.ERROR(
                    "GEMINI_API_KEY não configurado. Configure no arquivo .env"
                )
            )
            return

        database_url = os.getenv("DATABASE_URL", "")
        if "sqlite" in database_url or not database_url:
            self.stdout.write(
                self.style.WARNING(
                    "Aviso: pgvector requer PostgreSQL. Verifique DATABASE_URL."
                )
            )

        try:
            vector_service = VectorService()

            if options["dataset_id"]:
                self._index_single_dataset(
                    vector_service, dataset_id=options["dataset_id"]
                )
                return

            if options["table_name"]:
                self._index_single_dataset(
                    vector_service, table_name=options["table_name"]
                )
                return

            self._index_all_datasets(vector_service, force=options["all"])

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro: {str(e)}"))
            raise

    def _index_single_dataset(self, vector_service, dataset_id=None, table_name=None):
        """Indexa um único dataset."""
        try:
            if dataset_id:
                dataset = DataImportProcess.objects.get(id=dataset_id)
            else:
                dataset = DataImportProcess.objects.get(table_name=table_name)

            if dataset.status != "completed":
                self.stdout.write(
                    self.style.WARNING(
                        f"Dataset {dataset.table_name} não está completo (status: {dataset.status})"
                    )
                )
                return

            self.stdout.write(f"Indexando dataset: {dataset.table_name}...")

            vector_service.index_dataset(dataset, force=True)

            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Dataset {dataset.table_name} indexado com sucesso!"
                )
            )

        except DataImportProcess.DoesNotExist:
            identifier = dataset_id or table_name
            self.stdout.write(self.style.ERROR(f"Dataset não encontrado: {identifier}"))

    def _index_all_datasets(self, vector_service, force=False):
        """Indexa todos os datasets."""
        self.stdout.write("Iniciando indexação de datasets com LangChain + pgvector...\n")

        queryset = DataImportProcess.objects.filter(status="completed")

        if not force:
            queryset = queryset.filter(embedding__isnull=True)
            self.stdout.write("Indexando apenas datasets sem embedding...")
        else:
            self.stdout.write("Reindexando TODOS os datasets...")

        total = queryset.count()

        if total == 0:
            self.stdout.write(self.style.WARNING("Nenhum dataset para indexar."))
            return

        self.stdout.write(f"Total de datasets a indexar: {total}\n")

        stats = vector_service.bulk_index_datasets(
            dataset_ids=list(queryset.values_list("id", flat=True))
        )

        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS("INDEXAÇÃO CONCLUÍDA"))
        self.stdout.write("=" * 50)
        self.stdout.write(f"Total processado: {stats['total']}")
        self.stdout.write(self.style.SUCCESS(f"✓ Sucesso: {stats['success']}"))

        if stats["failed"] > 0:
            self.stdout.write(self.style.ERROR(f"✗ Falhas: {stats['failed']}"))

            if stats["errors"]:
                self.stdout.write("\nErros encontrados:")
                for error in stats["errors"][:10]:
                    self.stdout.write(
                        self.style.ERROR(f"  - {error['table_name']}: {error['error']}")
                    )

                if len(stats["errors"]) > 10:
                    self.stdout.write(f"  ... e mais {len(stats['errors']) - 10} erros")
