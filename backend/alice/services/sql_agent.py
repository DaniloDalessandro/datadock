"""
Agente SQL inteligente usando LangChain ReAct + Google Gemini
Permite consultas em linguagem natural aos dados reais dos datasets
"""

import json
import logging
import os
import re
from typing import Any, Optional

from django.core.cache import cache
from langchain.agents import AgentExecutor, create_react_agent
from langchain.memory import ConversationBufferWindowMemory
from langchain_core.prompts import PromptTemplate
from langchain_core.tools import Tool
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from data_import.models import DataImportProcess

logger = logging.getLogger(__name__)


def _get_engine():
    """Returns a SQLAlchemy engine for the PostgreSQL database."""
    db_url = os.getenv("DATABASE_URL", "")
    if db_url:
        # Convert Django-style URL to SQLAlchemy-compatible
        url = db_url.replace("postgres://", "postgresql+psycopg2://").replace(
            "postgresql://", "postgresql+psycopg2://"
        )
        return create_engine(url, pool_pre_ping=True)

    from django.conf import settings

    db = settings.DATABASES["default"]
    url = (
        f"postgresql+psycopg2://{db['USER']}:{db['PASSWORD']}"
        f"@{db['HOST']}:{db['PORT']}/{db['NAME']}"
    )
    return create_engine(url, pool_pre_ping=True)


def _safe_sql(query: str) -> str:
    """
    Validates that a SQL query is read-only (SELECT only).
    Raises ValueError if dangerous operations are detected.
    """
    normalized = query.strip().upper()
    # Remove comments
    normalized = re.sub(r"--[^\n]*", "", normalized)
    normalized = re.sub(r"/\*.*?\*/", "", normalized, flags=re.DOTALL)
    normalized = normalized.strip()

    dangerous = [
        "INSERT",
        "UPDATE",
        "DELETE",
        "DROP",
        "TRUNCATE",
        "ALTER",
        "CREATE",
        "GRANT",
        "REVOKE",
        "EXEC",
        "EXECUTE",
    ]

    for keyword in dangerous:
        if re.search(rf"\b{keyword}\b", normalized):
            raise ValueError(
                f"Operação não permitida: {keyword}. Apenas consultas SELECT são permitidas."
            )

    if not normalized.startswith("SELECT") and not normalized.startswith("WITH"):
        raise ValueError("Apenas consultas SELECT ou WITH (CTE) são permitidas.")

    return query


# ─── Tool functions ────────────────────────────────────────────────────────────


def list_datasets(_input: str = "") -> str:
    """Lista todos os datasets disponíveis com seus metadados."""
    try:
        datasets = DataImportProcess.objects.filter(
            status__in=["active", "completed"]
        ).values("table_name", "record_count", "column_structure", "created_at")

        if not datasets:
            return "Nenhum dataset ativo encontrado no sistema."

        result = []
        for ds in datasets:
            cols = list(ds["column_structure"].keys())[:8] if ds["column_structure"] else []
            result.append(
                f"- Tabela: {ds['table_name']} | "
                f"Registros: {ds['record_count'] or 0:,} | "
                f"Colunas: {', '.join(cols)}"
                + (" ..." if len(ds["column_structure"] or {}) > 8 else "")
            )

        return "Datasets disponíveis:\n" + "\n".join(result)
    except Exception as e:
        logger.error(f"list_datasets error: {e}")
        return f"Erro ao listar datasets: {str(e)}"


def get_table_schema(table_name: str) -> str:
    """Retorna o schema completo de uma tabela (colunas e tipos)."""
    table_name = table_name.strip().strip('"').lower()

    # Security: only allow tables that are registered datasets
    allowed = DataImportProcess.objects.filter(
        table_name=table_name, status__in=["active", "completed"]
    ).exists()
    if not allowed:
        return f"Tabela '{table_name}' não encontrada ou não está ativa."

    try:
        engine = _get_engine()
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                SELECT column_name, data_type, is_nullable, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = :table AND table_schema = 'public'
                ORDER BY ordinal_position
            """),
                {"table": table_name},
            )
            rows = result.fetchall()

        if not rows:
            return f"Tabela '{table_name}' não encontrada no banco."

        lines = [f"Schema da tabela '{table_name}':"]
        for col_name, data_type, nullable, max_len in rows:
            type_str = data_type
            if max_len:
                type_str += f"({max_len})"
            null_str = "nullable" if nullable == "YES" else "not null"
            lines.append(f"  - {col_name}: {type_str} [{null_str}]")
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"get_table_schema error: {e}")
        return f"Erro ao obter schema: {str(e)}"


def get_data_sample(input_str: str) -> str:
    """
    Retorna uma amostra de linhas de uma tabela.
    Input: 'table_name' ou 'table_name,5' (nome,limite)
    """
    parts = input_str.strip().split(",")
    table_name = parts[0].strip().strip('"').lower()
    limit = int(parts[1].strip()) if len(parts) > 1 else 5
    limit = min(limit, 20)  # Max 20 rows for context safety

    allowed = DataImportProcess.objects.filter(
        table_name=table_name, status__in=["active", "completed"]
    ).exists()
    if not allowed:
        return f"Tabela '{table_name}' não encontrada ou não está ativa."

    try:
        engine = _get_engine()
        with engine.connect() as conn:
            result = conn.execute(
                text(f'SELECT * FROM "{table_name}" LIMIT :limit'),
                {"limit": limit},
            )
            rows = result.fetchall()
            cols = list(result.keys())

        if not rows:
            return f"Tabela '{table_name}' está vazia."

        lines = [
            f"Amostra de {len(rows)} registros de '{table_name}':",
            f"Colunas: {cols}",
        ]
        for i, row in enumerate(rows, 1):
            lines.append(f"  Linha {i}: {dict(zip(cols, row))}")
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"get_data_sample error: {e}")
        return f"Erro ao obter amostra: {str(e)}"


def execute_sql_query(query: str) -> str:
    """
    Executa uma query SQL SELECT contra os dados reais.
    Retorna os resultados formatados. Apenas SELECT é permitido.
    Limite automático de 100 linhas para evitar respostas gigantes.
    """
    try:
        safe_query = _safe_sql(query)
    except ValueError as e:
        return f"Query bloqueada por segurança: {str(e)}"

    # Inject LIMIT if not present to protect context window
    if "limit" not in safe_query.lower():
        safe_query = safe_query.rstrip(";") + " LIMIT 100"

    # Validate that tables in the query are registered datasets
    # Extract table names from FROM/JOIN clauses
    table_pattern = re.findall(
        r'(?:FROM|JOIN)\s+"?([a-zA-Z_][a-zA-Z0-9_]*)"?',
        safe_query,
        re.IGNORECASE,
    )
    system_tables = {"information_schema", "pg_catalog"}
    for tbl in table_pattern:
        tbl_lower = tbl.lower()
        if tbl_lower in system_tables:
            continue
        if not DataImportProcess.objects.filter(
            table_name=tbl_lower, status__in=["active", "completed"]
        ).exists():
            return (
                f"Tabela '{tbl}' não é um dataset registrado. "
                "Use list_datasets para ver as tabelas disponíveis."
            )

    try:
        engine = _get_engine()
        with engine.connect() as conn:
            result = conn.execute(text(safe_query))
            rows = result.fetchall()
            cols = list(result.keys())

        if not rows:
            return "A query retornou 0 registros."

        # Format output
        lines = [f"Resultado ({len(rows)} linhas):"]
        lines.append(" | ".join(cols))
        lines.append("-" * 60)
        for row in rows[:50]:  # Show max 50 in context
            lines.append(" | ".join(str(v) for v in row))

        if len(rows) > 50:
            lines.append(f"... (mostrando 50 de {len(rows)} linhas)")

        return "\n".join(lines)
    except SQLAlchemyError as e:
        error_msg = str(e).split("\n")[0]
        logger.error(f"SQL execution error: {e}")
        return (
            f"Erro na query SQL: {error_msg}\n\n"
            "Verifique o schema com get_table_schema antes de tentar novamente."
        )


def get_column_statistics(input_str: str) -> str:
    """
    Calcula estatísticas de uma coluna numérica.
    Input: 'table_name,column_name'
    """
    parts = input_str.strip().split(",")
    if len(parts) < 2:
        return "Formato: 'nome_tabela,nome_coluna'"

    table_name = parts[0].strip().strip('"').lower()
    column_name = parts[1].strip().strip('"')

    allowed = DataImportProcess.objects.filter(
        table_name=table_name, status__in=["active", "completed"]
    ).exists()
    if not allowed:
        return f"Tabela '{table_name}' não encontrada."

    try:
        engine = _get_engine()
        with engine.connect() as conn:
            result = conn.execute(
                text(f"""
                SELECT
                    COUNT(*) as total,
                    COUNT("{column_name}") as non_null,
                    COUNT(*) - COUNT("{column_name}") as nulls,
                    MIN("{column_name}") as min_val,
                    MAX("{column_name}") as max_val,
                    AVG(CAST("{column_name}" AS NUMERIC)) as avg_val,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CAST("{column_name}" AS NUMERIC)) as median
                FROM "{table_name}"
            """)
            )
            row = result.fetchone()
            cols = list(result.keys())

        stats = dict(zip(cols, row))
        lines = [f"Estatísticas de '{table_name}'.'{column_name}':"]
        for k, v in stats.items():
            if v is not None and isinstance(v, float):
                lines.append(f"  {k}: {v:.4f}")
            else:
                lines.append(f"  {k}: {v}")
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"get_column_statistics error: {e}")
        return f"Erro ao calcular estatísticas (coluna pode não ser numérica): {str(e)}"


def search_datasets_rag(query: str) -> str:
    """Busca semanticamente datasets relevantes para a pergunta do usuário."""
    try:
        from alice.services.vector_service import VectorService

        vs = VectorService()
        results = vs.search_similar_datasets(query=query, limit=3)
        if not results:
            return "Nenhum dataset encontrado via busca semântica. Use list_datasets para ver todos."
        lines = ["Datasets mais relevantes para a pergunta:"]
        for r in results:
            ds = r["dataset"]
            sim = r.get("similarity", 0) * 100
            lines.append(
                f"- {ds.table_name} (relevância: {sim:.1f}%) | "
                f"{ds.record_count or 0:,} registros"
            )
        return "\n".join(lines)
    except Exception as e:
        logger.warning(f"RAG search failed: {e}")
        return list_datasets("")


# ─── Agent builder ─────────────────────────────────────────────────────────────

TOOLS = [
    Tool(
        name="list_datasets",
        func=list_datasets,
        description=(
            "Lista todos os datasets/tabelas disponíveis no sistema com seus nomes, "
            "quantidades de registros e colunas. Use SEMPRE como primeiro passo quando "
            "não sabe quais tabelas existem. Input: string vazia."
        ),
    ),
    Tool(
        name="search_datasets",
        func=search_datasets_rag,
        description=(
            "Busca semanticamente datasets relevantes para uma pergunta. "
            "Use quando precisar encontrar qual tabela contém os dados que o usuário quer. "
            "Input: a pergunta do usuário em linguagem natural."
        ),
    ),
    Tool(
        name="get_table_schema",
        func=get_table_schema,
        description=(
            "Retorna o schema completo de uma tabela: nomes das colunas, tipos de dados. "
            "SEMPRE chame antes de executar uma query SQL para conhecer os nomes exatos das colunas. "
            "Input: nome exato da tabela."
        ),
    ),
    Tool(
        name="get_data_sample",
        func=get_data_sample,
        description=(
            "Retorna uma amostra de linhas de uma tabela para entender o formato dos dados. "
            "Input: 'nome_tabela' ou 'nome_tabela,10' para 10 linhas."
        ),
    ),
    Tool(
        name="execute_sql",
        func=execute_sql_query,
        description=(
            "Executa uma query SQL SELECT nos dados reais. "
            "Use para agregações, filtros, contagens, grupos, joins entre datasets. "
            "Apenas SELECT é permitido. Use aspas duplas para nomes de colunas com espaços. "
            "Limite automático de 100 linhas. "
            "Input: query SQL completa e válida."
        ),
    ),
    Tool(
        name="get_column_statistics",
        func=get_column_statistics,
        description=(
            "Calcula estatísticas de uma coluna numérica: min, max, média, mediana, nulos. "
            "Input: 'nome_tabela,nome_coluna'."
        ),
    ),
]


AGENT_SYSTEM_PROMPT = """Você é a Alice, assistente de dados inteligente do DataPort.
Você tem acesso direto aos dados reais dos datasets via ferramentas SQL.

FERRAMENTAS DISPONÍVEIS:
{tools}

COMO USAR AS FERRAMENTAS:
Use o formato:

Thought: [seu raciocínio sobre o que fazer]
Action: [nome_da_ferramenta]
Action Input: [input para a ferramenta]
Observation: [resultado da ferramenta]
... (repita Thought/Action/Action Input/Observation quantas vezes precisar)
Thought: Tenho informações suficientes para responder
Final Answer: [sua resposta final em português, clara e completa]

REGRAS IMPORTANTES:
- Sempre use get_table_schema ANTES de executar SQL para conhecer os nomes exatos das colunas
- Use aspas duplas em nomes de colunas no SQL: SELECT "nome_coluna" FROM tabela
- Para encontrar a tabela certa, use search_datasets primeiro
- Se uma query falhar, leia o erro e corrija (schema errado, nome de coluna inválido, etc.)
- Responda sempre em português brasileiro
- Formate números com separadores: 1.234.567
- Se os dados não existirem, diga claramente
- Nunca invente dados — só use o que as ferramentas retornam
- Quando mostrar tabelas de dados na resposta, use formato markdown

NOMES DAS FERRAMENTAS: {tool_names}

HISTÓRICO DA CONVERSA:
{chat_history}

PERGUNTA DO USUÁRIO: {input}

{agent_scratchpad}"""


def build_agent(session_id: str):
    """
    Constrói o agente LangChain com memória de conversa por sessão.
    Returns a tuple of (AgentExecutor, ConversationBufferWindowMemory).
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your-gemini-api-key-here":
        raise ValueError("GEMINI_API_KEY não configurado")

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",  # Pro for better reasoning on complex SQL
        google_api_key=api_key,
        temperature=0.1,  # Low temperature for precise SQL generation
        max_retries=2,
    )

    prompt = PromptTemplate.from_template(AGENT_SYSTEM_PROMPT)

    # Redis-backed memory per session (10 last exchanges)
    memory = ConversationBufferWindowMemory(
        k=10,
        memory_key="chat_history",
        input_key="input",
        return_messages=False,
    )

    # Restore memory from Redis cache
    cached_history = cache.get(f"alice_memory_{session_id}")
    if cached_history:
        try:
            for exchange in cached_history:
                memory.save_context(
                    {"input": exchange["human"]},
                    {"output": exchange["ai"]},
                )
        except Exception:
            pass

    agent = create_react_agent(llm=llm, tools=TOOLS, prompt=prompt)

    executor = AgentExecutor(
        agent=agent,
        tools=TOOLS,
        memory=memory,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=8,
        early_stopping_method="force",
        return_intermediate_steps=True,
    )

    return executor, memory


def save_memory_to_cache(
    session_id: str, memory: Any, human_input: str, ai_output: str
) -> None:
    """Persiste a memória da conversa no Redis."""
    try:
        cached = cache.get(f"alice_memory_{session_id}") or []
        cached.append({"human": human_input, "ai": ai_output})
        # Keep last 10 exchanges
        cached = cached[-10:]
        cache.set(f"alice_memory_{session_id}", cached, 60 * 60 * 2)  # 2 hours
    except Exception as e:
        logger.warning(f"Could not save memory: {e}")
