"""
Serviço para gerenciamento de embeddings e busca vetorial
"""

import logging
import os
from typing import List, Optional

import google.generativeai as genai
from pgvector.django import L2Distance

from alice.models import DatasetEmbedding
from data_import.models import DataImportProcess

logger = logging.getLogger(__name__)


class VectorService:
    """
    Serviço para operações com embeddings e busca vetorial usando pgvector
    """

    def __init__(self):
        """Inicializa o cliente Gemini"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your-gemini-api-key-here":
            raise ValueError("GEMINI_API_KEY não configurado")

        genai.configure(api_key=api_key)
        self.model = "models/embedding-001"
        self.dimensions = 768  # Gemini embedding dimensions

    def generate_embedding(self, text: str) -> List[float]:
        """
        Gera embedding vetorial para um texto usando Google Gemini

        Args:
            text: Texto para gerar embedding

        Returns:
            Lista de floats representando o vetor de embedding
        """
        try:
            result = genai.embed_content(
                model=self.model, content=text, task_type="retrieval_document"
            )
            return result["embedding"]
        except Exception as e:
            logger.error(f"Erro ao gerar embedding: {str(e)}")
            raise

    def build_dataset_description(self, dataset: DataImportProcess) -> str:
        """
        Constrói descrição textual do dataset para gerar embedding

        Args:
            dataset: Dataset a ser descrito

        Returns:
            String com descrição completa do dataset
        """
        parts = [
            f"Nome da tabela: {dataset.table_name}",
            f"Título: {dataset.title or 'Sem título'}",
            f"Descrição: {dataset.description or 'Sem descrição'}",
        ]

        # Adiciona categorias
        if dataset.categories.exists():
            categories = ", ".join([cat.name for cat in dataset.categories.all()])
            parts.append(f"Categorias: {categories}")

        # Adiciona informações de colunas
        if dataset.columns:
            column_names = ", ".join(dataset.columns)
            parts.append(f"Colunas disponíveis: {column_names}")

        # Adiciona metadados relevantes
        if dataset.source:
            parts.append(f"Fonte: {dataset.source}")

        return " | ".join(parts)

    def index_dataset(
        self, dataset: DataImportProcess, force: bool = False
    ) -> Optional[DatasetEmbedding]:
        """
        Indexa um dataset no banco vetorial

        Args:
            dataset: Dataset a ser indexado
            force: Se True, recria o embedding mesmo que já exista

        Returns:
            DatasetEmbedding criado ou atualizado
        """
        try:
            # Verifica se já existe embedding
            if hasattr(dataset, "embedding") and not force:
                logger.info(f"Dataset {dataset.table_name} já possui embedding")
                return dataset.embedding

            # Constrói descrição
            description = self.build_dataset_description(dataset)

            # Gera embedding
            logger.info(f"Gerando embedding para dataset {dataset.table_name}")
            embedding_vector = self.generate_embedding(description)

            # Prepara metadados
            metadata = {
                "table_name": dataset.table_name,
                "title": dataset.title,
                "record_count": dataset.record_count,
                "categories": [cat.name for cat in dataset.categories.all()],
                "is_public": dataset.is_public,
            }

            # Cria ou atualiza embedding
            embedding_obj, created = DatasetEmbedding.objects.update_or_create(
                dataset=dataset,
                defaults={
                    "description": description,
                    "embedding": embedding_vector,
                    "metadata": metadata,
                },
            )

            action = "criado" if created else "atualizado"
            logger.info(f"Embedding {action} para dataset {dataset.table_name}")

            return embedding_obj

        except Exception as e:
            logger.error(f"Erro ao indexar dataset {dataset.table_name}: {str(e)}")
            raise

    def search_similar_datasets(
        self, query: str, limit: int = 5, only_public: bool = False
    ) -> List[dict]:
        """
        Busca datasets similares usando busca vetorial semântica

        Args:
            query: Consulta em linguagem natural
            limit: Número máximo de resultados
            only_public: Se True, retorna apenas datasets públicos

        Returns:
            Lista de dicionários com datasets e suas distâncias
        """
        try:
            # Gera embedding da query
            logger.info(f"Buscando datasets similares para: {query}")
            query_embedding = self.generate_embedding(query)

            # Busca por similaridade usando L2Distance
            queryset = DatasetEmbedding.objects.annotate(
                distance=L2Distance("embedding", query_embedding)
            ).order_by("distance")

            # Filtra apenas públicos se necessário
            if only_public:
                queryset = queryset.filter(dataset__is_public=True)

            # Limita resultados
            results = queryset.select_related("dataset")[:limit]

            # Formata resultados
            formatted_results = []
            for embedding_obj in results:
                formatted_results.append(
                    {
                        "dataset": embedding_obj.dataset,
                        "distance": float(embedding_obj.distance),
                        "title": embedding_obj.dataset.title
                        or embedding_obj.dataset.table_name,
                        "description": embedding_obj.dataset.description,
                        "table_name": embedding_obj.dataset.table_name,
                        "metadata": embedding_obj.metadata,
                    }
                )

            logger.info(f"Encontrados {len(formatted_results)} datasets similares")
            return formatted_results

        except Exception as e:
            logger.error(f"Erro ao buscar datasets similares: {str(e)}")
            raise

    def bulk_index_datasets(self, dataset_ids: Optional[List[int]] = None) -> dict:
        """
        Indexa múltiplos datasets em lote

        Args:
            dataset_ids: Lista de IDs de datasets. Se None, indexa todos

        Returns:
            Dicionário com estatísticas da indexação
        """
        stats = {"total": 0, "success": 0, "failed": 0, "errors": []}

        try:
            # Seleciona datasets
            if dataset_ids:
                datasets = DataImportProcess.objects.filter(
                    id__in=dataset_ids, status="completed"
                )
            else:
                datasets = DataImportProcess.objects.filter(status="completed")

            stats["total"] = datasets.count()
            logger.info(f"Iniciando indexação de {stats['total']} datasets")

            # Indexa cada dataset
            for dataset in datasets.prefetch_related("categories"):
                try:
                    self.index_dataset(dataset)
                    stats["success"] += 1
                except Exception as e:
                    stats["failed"] += 1
                    stats["errors"].append(
                        {
                            "dataset_id": dataset.id,
                            "table_name": dataset.table_name,
                            "error": str(e),
                        }
                    )
                    logger.error(f"Falha ao indexar {dataset.table_name}: {str(e)}")

            logger.info(
                f"Indexação concluída: {stats['success']} sucesso, "
                f"{stats['failed']} falhas de {stats['total']} total"
            )

            return stats

        except Exception as e:
            logger.error(f"Erro na indexação em lote: {str(e)}")
            raise
