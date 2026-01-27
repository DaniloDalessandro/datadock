"""
Views da Assistente de IA Alice usando LangChain
"""

import json
import logging
import os
import time
from datetime import datetime

from django.core.cache import cache
from django.db.models import Count, Q
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from alice.services import VectorService
from data_import.models import DataImportProcess

logger = logging.getLogger(__name__)


class AliceRateThrottle(UserRateThrottle):
    """Throttle customizado para API Alice - 30 requisições por minuto"""

    rate = "30/min"


class AliceChatView(APIView):
    """
    Assistente de IA Alice alimentada por LangChain + Google Gemini.
    POST /api/alice/chat/

    Request body:
    {
        "message": "Pergunta do usuário sobre datasets"
    }
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [AliceRateThrottle]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._llm = None

    def _get_llm(self):
        """Lazy initialization do LLM"""
        if self._llm is None:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key or api_key == "your-gemini-api-key-here":
                raise ValueError("GEMINI_API_KEY não configurado")

            self._llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=api_key,
                temperature=0.7,
                max_retries=3,
            )
        return self._llm

    def post(self, request):
        """
        Processa pergunta do usuário e retorna resposta da IA com contexto de datasets usando RAG.
        """
        try:
            user_message = request.data.get("message", "").strip()

            if not user_message:
                return Response(
                    {"success": False, "error": "Mensagem não pode estar vazia"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key or api_key == "your-gemini-api-key-here":
                return Response(
                    {
                        "success": False,
                        "error": "Chave da API Gemini não configurada. Configure GEMINI_API_KEY no arquivo .env",
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # Tenta usar RAG para melhor contexto, com fallback para contexto tradicional se necessário
            context = self._get_rag_context(user_message)

            system_prompt = f"""Você é a Alice, assistente virtual do DataPort - um sistema de gestão de dados portuários.
Você deve responder perguntas sobre os datasets cadastrados no sistema de forma clara e objetiva.

CONTEXTO DOS DADOS DISPONÍVEIS:
{json.dumps(context, indent=2, ensure_ascii=False)}

INSTRUÇÕES:
- Responda em português brasileiro
- Seja objetiva e direta
- Use os dados do contexto fornecido
- Formate números com separadores de milhares quando apropriado
- Use markdown para destacar informações importantes (**negrito** para números e métricas)
- Se a pergunta não puder ser respondida com os dados disponíveis, seja honesta e sugira o que você pode responder
- Mantenha respostas concisas mas informativas

PERGUNTA DO USUÁRIO:
{user_message}

Sua resposta:"""

            response_text = self._get_llm_response_with_retry(system_prompt)

            return Response(
                {
                    "success": True,
                    "response": response_text,
                    "timestamp": datetime.now().isoformat(),
                }
            )

        except Exception as e:
            import traceback

            error_message = str(e)
            logger.error(f"Error in Alice chat: {traceback.format_exc()}")

            if "429" in error_message or "RATE_LIMIT_EXCEEDED" in error_message:
                return Response(
                    {
                        "success": False,
                        "error": "A Alice está processando muitas requisições no momento. Por favor, aguarde alguns segundos e tente novamente.",
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            if "quota" in error_message.lower() or "limit" in error_message.lower():
                return Response(
                    {
                        "success": False,
                        "error": "Limite de uso da API foi atingido. Por favor, tente novamente em alguns minutos.",
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            return Response(
                {
                    "success": False,
                    "error": "Erro ao processar pergunta. Tente novamente em alguns instantes.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _get_llm_response_with_retry(self, prompt, max_retries=3):
        """
        Obtém resposta do LLM com retry usando backoff exponencial.
        """
        llm = self._get_llm()

        for attempt in range(max_retries):
            try:
                messages = [HumanMessage(content=prompt)]
                response = llm.invoke(messages)
                return response.content
            except Exception as e:
                error_message = str(e)

                # Se for erro de rate limit e não for a última tentativa, retentar com backoff exponencial
                if (
                    "429" in error_message or "RATE_LIMIT_EXCEEDED" in error_message
                ) and attempt < max_retries - 1:
                    wait_time = (2**attempt) * 3  # Backoff exponencial: 3, 6, 12 segundos
                    logger.warning(
                        f"Rate limit hit, waiting {wait_time}s before retry {attempt + 1}/{max_retries}"
                    )
                    time.sleep(wait_time)
                    continue

                # Se for a última tentativa ou erro diferente, lança a exceção
                raise

    def _get_rag_context(self, user_message):
        """
        Obtém contexto de datasets usando RAG (Retrieval Augmented Generation) com LangChain.
        Faz fallback para contexto tradicional se RAG não estiver disponível.
        """
        try:
            # Tenta usar busca vetorial (RAG) para melhor contexto semântico
            vector_service = VectorService()
            similar_datasets = vector_service.search_similar_datasets(
                query=user_message, limit=5, only_public=False
            )

            if similar_datasets:
                context = {
                    "tipo_busca": "RAG - Busca Semântica com LangChain + pgvector (Top 5 mais relevantes)",
                    "datasets_relevantes": [],
                }

                for result in similar_datasets:
                    dataset = result["dataset"]
                    similarity_pct = result.get("similarity", 0) * 100

                    dataset_info = {
                        "nome": dataset.table_name,
                        "titulo": result["title"],
                        "descricao": result["description"],
                        "registros": dataset.record_count or 0,
                        "status": dataset.get_status_display(),
                        "relevancia": f"{similarity_pct:.1f}%",
                        "categorias": [cat.name for cat in dataset.categories.all()] if hasattr(dataset, 'categories') else [],
                        "criado_em": dataset.created_at.strftime("%d/%m/%Y"),
                    }

                    if dataset.column_structure:
                        dataset_info["colunas"] = list(dataset.column_structure.keys())[
                            :10
                        ]

                    context["datasets_relevantes"].append(dataset_info)

                total_records = sum(
                    d.record_count or 0
                    for d in [r["dataset"] for r in similar_datasets]
                )
                context["resumo"] = {
                    "datasets_encontrados": len(similar_datasets),
                    "total_registros": total_records,
                }

                logger.info(f"RAG context built with {len(similar_datasets)} datasets")
                return context

        except Exception as e:
            logger.warning(f"RAG context failed, falling back to traditional: {str(e)}")

        # Fallback para contexto tradicional com cache
        return self._get_cached_dataset_context()

    def _get_cached_dataset_context(self):
        """
        Obtém contexto de datasets com cache de 5 minutos.
        """
        cache_key = "alice_dataset_context"
        context = cache.get(cache_key)

        if context is None:
            context = self._build_dataset_context()
            cache.set(cache_key, context, 300)  # Cache por 5 minutos

        return context

    def _build_dataset_context(self):
        """
        Constrói contexto abrangente sobre datasets para o LLM.
        """
        all_processes = DataImportProcess.objects.all()

        status_counts = all_processes.aggregate(
            active=Count("id", filter=Q(status="active")),
            inactive=Count("id", filter=Q(status="inactive")),
            processing=Count("id", filter=Q(status="processing")),
            pending=Count("id", filter=Q(status="pending")),
        )

        total_records = sum(p.record_count or 0 for p in all_processes)

        datasets_info = []
        for process in all_processes:
            dataset_info = {
                "nome": process.table_name,
                "status": process.get_status_display(),
                "registros": process.record_count or 0,
                "colunas": (
                    len(process.column_structure) if process.column_structure else 0
                ),
                "criado_em": process.created_at.strftime("%d/%m/%Y"),
                "tipo_importacao": (
                    process.get_import_type_display()
                    if hasattr(process, "import_type")
                    else "Não especificado"
                ),
            }

            if process.column_structure:
                dataset_info["nomes_colunas"] = list(process.column_structure.keys())[
                    :10
                ]

            datasets_info.append(dataset_info)

        total_datasets = len(all_processes)
        avg_records = total_records / total_datasets if total_datasets > 0 else 0

        context = {
            "resumo": {
                "total_datasets": total_datasets,
                "datasets_ativos": status_counts["active"],
                "datasets_inativos": status_counts["inactive"],
                "datasets_processando": status_counts["processing"],
                "datasets_pendentes": status_counts["pending"],
                "total_registros": total_records,
                "media_registros_por_dataset": round(avg_records, 0),
            },
            "datasets": datasets_info[:50],  # Limita a 50 datasets para evitar limite de tokens
        }

        if total_datasets > 50:
            context["nota"] = f"Mostrando 50 de {total_datasets} datasets disponíveis"

        return context


class AliceHealthView(APIView):
    """
    Health check para serviço Alice.
    GET /api/alice/health/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Verifica se o serviço Alice está saudável"""
        gemini_key = os.getenv("GEMINI_API_KEY")

        health_data = {
            "status": "healthy",
            "service": "Alice AI Assistant",
            "framework": "LangChain",
            "gemini_configured": bool(
                gemini_key and gemini_key != "your-gemini-api-key-here"
            ),
            "rag_enabled": bool(
                gemini_key and gemini_key != "your-gemini-api-key-here"
            ),
            "vector_store": "pgvector (LangChain)",
            "embedding_model": "Google Gemini models/embedding-001",
            "llm_model": "Google Gemini gemini-1.5-flash",
            "timestamp": datetime.now().isoformat(),
        }

        return Response(health_data)
