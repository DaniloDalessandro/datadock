"""
Serviço para gerenciamento de embeddings e busca vetorial usando LangChain + pgvector
"""

import logging
import os
from typing import List, Optional

from django.conf import settings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document

from alice.models import DatasetEmbedding
from data_import.models import DataImportProcess

logger = logging.getLogger(__name__)


class VectorService:
    """
    Serviço para operações com embeddings e busca vetorial usando LangChain + pgvector
    """

    COLLECTION_NAME = "alice_datasets"

    def __init__(self):
        """Inicializa o serviço com LangChain e pgvector"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your-gemini-api-key-here":
            raise ValueError("GEMINI_API_KEY não configurado")

        # Inicializa embeddings com LangChain + Google Gemini
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=api_key,
            task_type="retrieval_document",
        )
        self.dimensions = 768  # Dimensões do embedding Gemini

        # Connection string para PostgreSQL
        self._connection_string = self._get_connection_string()

        # Inicializa PGVector store
        self._vector_store = None

    def _get_connection_string(self) -> str:
        """Obtém a connection string do PostgreSQL"""
        database_url = os.getenv("DATABASE_URL", "")

        if database_url and "postgresql" in database_url:
            # Converte formato django para psycopg
            return database_url.replace("postgres://", "postgresql+psycopg://")

        # Fallback para configuração do Django
        db_config = settings.DATABASES.get("default", {})
        if db_config.get("ENGINE", "").endswith("postgresql"):
            host = db_config.get("HOST", "localhost")
            port = db_config.get("PORT", "5432")
            name = db_config.get("NAME", "dataport")
            user = db_config.get("USER", "dataport")
            password = db_config.get("PASSWORD", "")
            return f"postgresql+psycopg://{user}:{password}@{host}:{port}/{name}"

        raise ValueError("PostgreSQL não configurado. pgvector requer PostgreSQL.")

    @property
    def vector_store(self) -> PGVector:
        """Lazy initialization do vector store"""
        if self._vector_store is None:
            self._vector_store = PGVector(
                embeddings=self.embeddings,
                collection_name=self.COLLECTION_NAME,
                connection=self._connection_string,
                use_jsonb=True,
            )
        return self._vector_store

    def generate_embedding(self, text: str) -> List[float]:
        """
        Gera embedding vetorial para um texto usando LangChain + Google Gemini

        Args:
            text: Texto para gerar embedding

        Returns:
            Lista de floats representando o vetor de embedding
        """
        try:
            embedding = self.embeddings.embed_query(text)
            return embedding
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
            f"Título: {getattr(dataset, 'title', None) or 'Sem título'}",
            f"Descrição: {getattr(dataset, 'description', None) or 'Sem descrição'}",
        ]

        # Adiciona categorias
        if hasattr(dataset, 'categories') and dataset.categories.exists():
            categories = ", ".join([cat.name for cat in dataset.categories.all()])
            parts.append(f"Categorias: {categories}")

        # Adiciona informações de colunas
        columns = getattr(dataset, 'columns', None) or (
            list(dataset.column_structure.keys()) if dataset.column_structure else None
        )
        if columns:
            column_names = ", ".join(columns[:20])  # Limita a 20 colunas
            parts.append(f"Colunas disponíveis: {column_names}")

        # Adiciona metadados relevantes
        source = getattr(dataset, 'source', None)
        if source:
            parts.append(f"Fonte: {source}")

        # Adiciona contagem de registros
        if dataset.record_count:
            parts.append(f"Total de registros: {dataset.record_count}")

        return " | ".join(parts)

    def _build_metadata(self, dataset: DataImportProcess) -> dict:
        """Constrói metadados para o documento"""
        return {
            "dataset_id": dataset.id,
            "table_name": dataset.table_name,
            "title": getattr(dataset, 'title', None) or dataset.table_name,
            "record_count": dataset.record_count or 0,
            "categories": [cat.name for cat in dataset.categories.all()] if hasattr(dataset, 'categories') else [],
            "is_public": getattr(dataset, 'is_public', False),
            "status": dataset.status,
        }

    def index_dataset(
        self, dataset: DataImportProcess, force: bool = False
    ) -> Optional[DatasetEmbedding]:
        """
        Indexa um dataset no banco vetorial usando LangChain + pgvector

        Args:
            dataset: Dataset a ser indexado
            force: Se True, recria o embedding mesmo que já exista

        Returns:
            DatasetEmbedding criado ou atualizado
        """
        try:
            # Verifica se já existe embedding no modelo Django
            existing_embedding = None
            if hasattr(dataset, "embedding"):
                try:
                    existing_embedding = dataset.embedding
                    if not force:
                        logger.info(f"Dataset {dataset.table_name} já possui embedding")
                        return existing_embedding
                except DatasetEmbedding.DoesNotExist:
                    pass

            description = self.build_dataset_description(dataset)
            metadata = self._build_metadata(dataset)

            logger.info(f"Gerando embedding para dataset {dataset.table_name}")

            # Gera embedding usando LangChain
            embedding_vector = self.generate_embedding(description)

            # Cria documento para LangChain/pgvector
            doc = Document(
                page_content=description,
                metadata=metadata,
            )

            # Remove documento anterior se existir (para reindexação)
            try:
                self.vector_store.delete(
                    filter={"dataset_id": dataset.id}
                )
            except Exception:
                pass  # Ignora se não existir

            # Adiciona novo documento ao vector store
            self.vector_store.add_documents([doc])

            # Também salva no modelo Django para compatibilidade
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
        Busca datasets similares usando LangChain + pgvector

        Args:
            query: Consulta em linguagem natural
            limit: Número máximo de resultados
            only_public: Se True, retorna apenas datasets públicos

        Returns:
            Lista de dicionários com datasets e suas distâncias
        """
        try:
            logger.info(f"Buscando datasets similares para: {query}")

            # Prepara filtro se necessário
            filter_dict = None
            if only_public:
                filter_dict = {"is_public": True}

            # Busca com LangChain pgvector
            results = self.vector_store.similarity_search_with_score(
                query=query,
                k=limit,
                filter=filter_dict,
            )

            formatted_results = []
            for doc, score in results:
                # Busca o dataset real do banco
                dataset_id = doc.metadata.get("dataset_id")
                try:
                    dataset = DataImportProcess.objects.prefetch_related("categories").get(id=dataset_id)
                except DataImportProcess.DoesNotExist:
                    logger.warning(f"Dataset {dataset_id} não encontrado")
                    continue

                # Score do pgvector é distância (menor = melhor)
                # Convertemos para similaridade (maior = melhor)
                similarity = 1 / (1 + score) if score >= 0 else 0

                formatted_results.append(
                    {
                        "dataset": dataset,
                        "distance": float(score),
                        "similarity": similarity,
                        "title": doc.metadata.get("title", dataset.table_name),
                        "description": getattr(dataset, 'description', None),
                        "table_name": dataset.table_name,
                        "metadata": doc.metadata,
                    }
                )

            logger.info(f"Encontrados {len(formatted_results)} datasets similares")
            return formatted_results

        except Exception as e:
            logger.error(f"Erro ao buscar datasets similares: {str(e)}")
            raise

    def bulk_index_datasets(self, dataset_ids: Optional[List[int]] = None) -> dict:
        """
        Indexa múltiplos datasets em lote usando LangChain

        Args:
            dataset_ids: Lista de IDs de datasets. Se None, indexa todos

        Returns:
            Dicionário com estatísticas da indexação
        """
        stats = {"total": 0, "success": 0, "failed": 0, "errors": []}

        try:
            if dataset_ids:
                datasets = DataImportProcess.objects.filter(
                    id__in=dataset_ids, status="completed"
                )
            else:
                datasets = DataImportProcess.objects.filter(status="completed")

            stats["total"] = datasets.count()
            logger.info(f"Iniciando indexação de {stats['total']} datasets")

            # Prepara documentos em lote para eficiência
            documents = []
            dataset_map = {}

            for dataset in datasets.prefetch_related("categories"):
                try:
                    description = self.build_dataset_description(dataset)
                    metadata = self._build_metadata(dataset)

                    doc = Document(
                        page_content=description,
                        metadata=metadata,
                    )
                    documents.append(doc)
                    dataset_map[dataset.id] = (dataset, description, metadata)

                except Exception as e:
                    stats["failed"] += 1
                    stats["errors"].append(
                        {
                            "dataset_id": dataset.id,
                            "table_name": dataset.table_name,
                            "error": str(e),
                        }
                    )
                    logger.error(f"Falha ao preparar {dataset.table_name}: {str(e)}")

            # Adiciona documentos em lote ao vector store
            if documents:
                try:
                    self.vector_store.add_documents(documents)

                    # Salva também nos modelos Django
                    for dataset_id, (dataset, description, metadata) in dataset_map.items():
                        try:
                            embedding_vector = self.generate_embedding(description)
                            DatasetEmbedding.objects.update_or_create(
                                dataset=dataset,
                                defaults={
                                    "description": description,
                                    "embedding": embedding_vector,
                                    "metadata": metadata,
                                },
                            )
                            stats["success"] += 1
                        except Exception as e:
                            stats["failed"] += 1
                            stats["errors"].append(
                                {
                                    "dataset_id": dataset_id,
                                    "table_name": dataset.table_name,
                                    "error": str(e),
                                }
                            )

                except Exception as e:
                    logger.error(f"Erro ao adicionar documentos em lote: {str(e)}")
                    # Tenta indexar individualmente
                    for dataset_id, (dataset, description, metadata) in dataset_map.items():
                        try:
                            self.index_dataset(dataset, force=True)
                            stats["success"] += 1
                        except Exception as e2:
                            stats["failed"] += 1
                            stats["errors"].append(
                                {
                                    "dataset_id": dataset_id,
                                    "table_name": dataset.table_name,
                                    "error": str(e2),
                                }
                            )

            logger.info(
                f"Indexação concluída: {stats['success']} sucesso, "
                f"{stats['failed']} falhas de {stats['total']} total"
            )

            return stats

        except Exception as e:
            logger.error(f"Erro na indexação em lote: {str(e)}")
            raise

    def delete_dataset_embedding(self, dataset_id: int) -> bool:
        """
        Remove embedding de um dataset do vector store

        Args:
            dataset_id: ID do dataset

        Returns:
            True se removido com sucesso
        """
        try:
            # Remove do LangChain/pgvector
            self.vector_store.delete(filter={"dataset_id": dataset_id})

            # Remove do modelo Django
            DatasetEmbedding.objects.filter(dataset_id=dataset_id).delete()

            logger.info(f"Embedding removido para dataset {dataset_id}")
            return True
        except Exception as e:
            logger.error(f"Erro ao remover embedding: {str(e)}")
            return False
