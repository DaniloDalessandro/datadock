"""
Agente de dados inteligente — Alice
LangChain ReAct + Google Gemini + SQLAlchemy + Pandas + Matplotlib

Níveis implementados:
  1. SQLDatabaseToolkit oficial (list, schema, check, execute)
  2. Python/Pandas REPL seguro + geração de gráficos base64
  3. ConversationSummaryBufferMemory + EntityMemory
  4. Ferramenta de planejamento para perguntas complexas
"""

import base64
import io
import json
import logging
import os
import re
import textwrap
from contextlib import redirect_stdout
from typing import Any, Optional

import pandas as pd
from django.core.cache import cache
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, AIMessage
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain_community.utilities import SQLDatabase
from langchain_core.tools import Tool
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError

from data_import.models import DataImportProcess

logger = logging.getLogger(__name__)

# ─── Engine ───────────────────────────────────────────────────────────────────

def _get_db_url() -> str:
    db_url = os.getenv("DATABASE_URL", "")
    if db_url:
        return (
            db_url
            .replace("postgres://", "postgresql+psycopg2://")
            .replace("postgresql://", "postgresql+psycopg2://")
        )
    from django.conf import settings
    db = settings.DATABASES["default"]
    return (
        f"postgresql+psycopg2://{db['USER']}:{db['PASSWORD']}"
        f"@{db['HOST']}:{db['PORT']}/{db['NAME']}"
    )


def _get_engine():
    return create_engine(_get_db_url(), pool_pre_ping=True)


def _get_dataset_tables() -> list[str]:
    """Returns only tables registered as active/completed datasets."""
    return list(
        DataImportProcess.objects.filter(
            status__in=["active", "completed"]
        ).values_list("table_name", flat=True)
    )


def _safe_sql_check(query: str) -> str | None:
    """Returns error message if query is unsafe, None if OK."""
    normalized = re.sub(r"--[^\n]*", "", query.strip().upper())
    normalized = re.sub(r"/\*.*?\*/", "", normalized, flags=re.DOTALL).strip()
    for kw in ["INSERT", "UPDATE", "DELETE", "DROP", "TRUNCATE", "ALTER",
               "CREATE", "GRANT", "REVOKE", "EXEC", "EXECUTE"]:
        if re.search(rf"\b{kw}\b", normalized):
            return f"Operação não permitida: {kw}. Apenas SELECT/WITH."
    if not (normalized.startswith("SELECT") or normalized.startswith("WITH")):
        return "Apenas SELECT ou WITH (CTE) são permitidos."
    return None


# ─── Level 1 — SQLDatabaseToolkit (official LangChain) ───────────────────────

def _build_sql_toolkit(llm) -> list:
    """
    Builds the official LangChain SQLDatabaseToolkit restricted to dataset tables.
    Provides: list_tables, schema_info, query_checker, execute_sql.
    """
    dataset_tables = _get_dataset_tables()
    if not dataset_tables:
        return []

    try:
        db = SQLDatabase.from_uri(
            _get_db_url(),
            include_tables=dataset_tables,
            sample_rows_in_table_info=2,
        )
        toolkit = SQLDatabaseToolkit(db=db, llm=llm)
        return toolkit.get_tools()
    except Exception as e:
        logger.warning(f"SQLDatabaseToolkit init failed: {e}")
        return []


# ─── Level 2a — Safe Pandas REPL ─────────────────────────────────────────────

_ALLOWED_IMPORTS = {"pandas", "pd", "numpy", "np", "json", "math", "datetime", "re"}
_BLOCKED_PATTERNS = [
    r"\bos\b", r"\bsys\b", r"\bsubprocess\b", r"\bopen\b",
    r"\beval\b", r"\bexec\b", r"\b__import__\b", r"\bshutil\b",
    r"\bsocket\b", r"\brequests\b", r"\burllib\b",
]


def _is_code_safe(code: str) -> tuple[bool, str]:
    for pattern in _BLOCKED_PATTERNS:
        if re.search(pattern, code):
            return False, f"Código bloqueado: padrão proibido '{pattern}'"
    return True, ""


def pandas_analysis(input_str: str) -> str:
    """
    Executa código pandas em um dataset carregado do banco.
    Input: 'nome_tabela\\n```python\\ncódigo aqui\\n```'
    O DataFrame estará disponível como 'df'.
    Exemplo: 'vendas\\n```python\\nprint(df.describe())\\n```'
    """
    # Parse table name and code block
    lines = input_str.strip().split("\n", 1)
    table_name = lines[0].strip().strip('"').lower()
    code_block = lines[1].strip() if len(lines) > 1 else ""

    # Strip markdown code fences
    code = re.sub(r"^```\w*\n?", "", code_block).rstrip("`").strip()

    if not code:
        return "Forneça o código após o nome da tabela. Ex: 'tabela\\nprint(df.head())'"

    # Security check
    safe, err = _is_code_safe(code)
    if not safe:
        return f"Código bloqueado por segurança: {err}"

    # Whitelist table
    if not DataImportProcess.objects.filter(
        table_name=table_name, status__in=["active", "completed"]
    ).exists():
        return f"Tabela '{table_name}' não encontrada."

    try:
        engine = _get_engine()
        with engine.connect() as conn:
            df = pd.read_sql(f'SELECT * FROM "{table_name}" LIMIT 10000', conn)

        # Safe execution namespace
        namespace = {
            "df": df,
            "pd": pd,
            "json": json,
            "__builtins__": {
                "print": print, "len": len, "range": range, "enumerate": enumerate,
                "zip": zip, "list": list, "dict": dict, "str": str, "int": int,
                "float": float, "bool": bool, "round": round, "abs": abs,
                "min": min, "max": max, "sum": sum, "sorted": sorted,
                "isinstance": isinstance, "type": type,
            },
        }

        output_buf = io.StringIO()
        with redirect_stdout(output_buf):
            exec(textwrap.dedent(code), namespace)  # noqa: S102

        result = output_buf.getvalue().strip()

        # Also capture last expression value if no print was used
        if not result and "_result" in namespace:
            result = str(namespace["_result"])

        return result or "Código executado sem output. Use print() para ver resultados."

    except Exception as e:
        logger.error(f"pandas_analysis error: {e}")
        return f"Erro ao executar pandas: {str(e)}"


# ─── Level 2b — Chart generation ─────────────────────────────────────────────

def generate_chart(input_str: str) -> str:
    """
    Gera um gráfico a partir de uma query SQL e retorna como imagem base64.
    Input JSON: {"table": "nome", "query": "SELECT ...", "chart_type": "bar|line|scatter|hist|pie", "x": "col", "y": "col", "title": "..."}
    """
    try:
        import matplotlib
        matplotlib.use("Agg")  # Non-interactive backend
        import matplotlib.pyplot as plt

        params = json.loads(input_str)
        table = params.get("table", "").lower()
        query = params.get("query", "")
        chart_type = params.get("chart_type", "bar")
        x_col = params.get("x")
        y_col = params.get("y")
        title = params.get("title", "Gráfico")

        # Security check
        if table and not DataImportProcess.objects.filter(
            table_name=table, status__in=["active", "completed"]
        ).exists():
            return f"Tabela '{table}' não encontrada."

        if query:
            err = _safe_sql_check(query)
            if err:
                return err

        engine = _get_engine()
        with engine.connect() as conn:
            if query:
                df = pd.read_sql(query, conn)
            else:
                df = pd.read_sql(f'SELECT * FROM "{table}" LIMIT 1000', conn)

        if df.empty:
            return "Sem dados para gerar gráfico."

        fig, ax = plt.subplots(figsize=(10, 6))
        fig.patch.set_facecolor("#f8fafc")
        ax.set_facecolor("#f8fafc")

        if chart_type == "bar" and x_col and y_col:
            df.plot.bar(x=x_col, y=y_col, ax=ax, color="#6366f1")
        elif chart_type == "line" and x_col and y_col:
            df.plot.line(x=x_col, y=y_col, ax=ax, color="#6366f1")
        elif chart_type == "scatter" and x_col and y_col:
            df.plot.scatter(x=x_col, y=y_col, ax=ax, color="#6366f1", alpha=0.6)
        elif chart_type == "hist" and y_col:
            df[y_col].dropna().plot.hist(ax=ax, bins=20, color="#6366f1", alpha=0.8)
        elif chart_type == "pie" and x_col and y_col:
            df.set_index(x_col)[y_col].plot.pie(ax=ax, autopct="%1.1f%%")
        else:
            # Fallback: bar of first two columns
            numeric_cols = df.select_dtypes(include="number").columns.tolist()
            if numeric_cols:
                df[numeric_cols[0]].head(20).plot.bar(ax=ax, color="#6366f1")

        ax.set_title(title, fontsize=14, fontweight="bold", pad=15)
        ax.tick_params(axis="x", rotation=45)
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=120, bbox_inches="tight")
        plt.close(fig)
        buf.seek(0)
        img_b64 = base64.b64encode(buf.read()).decode("utf-8")

        return json.dumps({"chart_base64": img_b64, "title": title})

    except Exception as e:
        logger.error(f"generate_chart error: {e}")
        return f"Erro ao gerar gráfico: {str(e)}"


# ─── Level 2c — Correlation matrix ───────────────────────────────────────────

def correlation_matrix(table_name: str) -> str:
    """
    Calcula a matriz de correlação de Pearson entre todas as colunas numéricas.
    Retorna pares com correlação > 0.5 (positiva ou negativa).
    Input: nome da tabela.
    """
    table_name = table_name.strip().lower()
    if not DataImportProcess.objects.filter(
        table_name=table_name, status__in=["active", "completed"]
    ).exists():
        return f"Tabela '{table_name}' não encontrada."
    try:
        engine = _get_engine()
        with engine.connect() as conn:
            df = pd.read_sql(f'SELECT * FROM "{table_name}" LIMIT 5000', conn)

        numeric = df.select_dtypes(include="number")
        if numeric.shape[1] < 2:
            return "A tabela não tem colunas numéricas suficientes para correlação."

        corr = numeric.corr()
        pairs = []
        cols = corr.columns.tolist()
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                val = corr.iloc[i, j]
                if abs(val) >= 0.5:
                    direction = "positiva" if val > 0 else "negativa"
                    strength = "forte" if abs(val) >= 0.8 else "moderada"
                    pairs.append(
                        f"  {cols[i]} ↔ {cols[j]}: {val:.3f} ({strength} {direction})"
                    )

        if not pairs:
            return "Nenhuma correlação significativa (|r| ≥ 0.5) encontrada entre colunas numéricas."

        return (
            f"Correlações significativas em '{table_name}' "
            f"({numeric.shape[1]} colunas numéricas, {len(df):,} linhas):\n"
            + "\n".join(pairs)
        )
    except Exception as e:
        logger.error(f"correlation_matrix error: {e}")
        return f"Erro: {str(e)}"


# ─── Level 2d — Data quality report ──────────────────────────────────────────

def detect_data_quality(table_name: str) -> str:
    """
    Gera um relatório completo de qualidade dos dados:
    nulos por coluna, duplicatas, cardinalidade, tipos suspeitos.
    Input: nome da tabela.
    """
    table_name = table_name.strip().lower()
    if not DataImportProcess.objects.filter(
        table_name=table_name, status__in=["active", "completed"]
    ).exists():
        return f"Tabela '{table_name}' não encontrada."
    try:
        engine = _get_engine()
        with engine.connect() as conn:
            df = pd.read_sql(f'SELECT * FROM "{table_name}" LIMIT 10000', conn)

        total = len(df)
        if total == 0:
            return "Tabela vazia."

        lines = [f"Relatório de qualidade — '{table_name}' ({total:,} linhas, {len(df.columns)} colunas)\n"]

        # Duplicates
        dupes = df.duplicated().sum()
        lines.append(f"Duplicatas exatas: {dupes:,} ({dupes/total*100:.1f}%)")

        # Per-column analysis
        lines.append("\nAnálise por coluna:")
        issues = []
        for col in df.columns:
            null_count = df[col].isna().sum()
            null_pct = null_count / total * 100
            unique = df[col].nunique()
            dtype = str(df[col].dtype)
            flag = "⚠" if null_pct > 20 else "✓"

            line = f"  {flag} {col} [{dtype}] — {null_pct:.1f}% nulos, {unique:,} únicos"

            # Detect numbers stored as strings
            if dtype == "object":
                sample = df[col].dropna().head(50)
                numeric_like = sample.str.match(r"^\s*-?\d+\.?\d*\s*$", na=False).sum()
                if numeric_like > len(sample) * 0.8:
                    line += " ⚠ (possível número como texto)"
                    issues.append(f"Coluna '{col}' parece numérica mas está como texto")

            lines.append(line)

        if issues:
            lines.append("\nProblemas detectados:")
            for issue in issues:
                lines.append(f"  • {issue}")
        else:
            lines.append("\nNenhum problema crítico detectado.")

        return "\n".join(lines)
    except Exception as e:
        logger.error(f"detect_data_quality error: {e}")
        return f"Erro: {str(e)}"


# ─── Level 2e — Value distribution ───────────────────────────────────────────

def get_value_distribution(input_str: str) -> str:
    """
    Distribuição de frequência dos top valores de uma coluna categórica.
    Input: 'nome_tabela,nome_coluna' ou 'nome_tabela,nome_coluna,20'
    """
    parts = input_str.strip().split(",")
    if len(parts) < 2:
        return "Formato: 'tabela,coluna' ou 'tabela,coluna,limite'"
    table_name = parts[0].strip().lower()
    column = parts[1].strip()
    limit = int(parts[2].strip()) if len(parts) > 2 else 15

    if not DataImportProcess.objects.filter(
        table_name=table_name, status__in=["active", "completed"]
    ).exists():
        return f"Tabela '{table_name}' não encontrada."
    try:
        engine = _get_engine()
        with engine.connect() as conn:
            result = conn.execute(text(f"""
                SELECT "{column}", COUNT(*) as total,
                       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pct
                FROM "{table_name}"
                WHERE "{column}" IS NOT NULL
                GROUP BY "{column}"
                ORDER BY total DESC
                LIMIT :limit
            """), {"limit": limit})
            rows = result.fetchall()

        if not rows:
            return f"Sem dados na coluna '{column}'."

        lines = [f"Distribuição de '{column}' em '{table_name}' (top {limit}):"]
        for val, count, pct in rows:
            bar = "█" * int(pct / 5)
            lines.append(f"  {str(val):<30} {count:>8,}  {pct:>5.1f}%  {bar}")
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"get_value_distribution error: {e}")
        return f"Erro: {str(e)}"


# ─── Level 2f — Find related datasets ────────────────────────────────────────

def find_related_datasets(table_name: str) -> str:
    """
    Encontra outros datasets com colunas em comum (candidatos a JOIN).
    Input: nome da tabela de referência.
    """
    table_name = table_name.strip().lower()
    dataset = DataImportProcess.objects.filter(
        table_name=table_name, status__in=["active", "completed"]
    ).first()
    if not dataset or not dataset.column_structure:
        return f"Tabela '{table_name}' não encontrada ou sem schema."

    ref_cols = {c.lower() for c in dataset.column_structure.keys()}
    others = DataImportProcess.objects.filter(
        status__in=["active", "completed"]
    ).exclude(table_name=table_name)

    results = []
    for other in others:
        if not other.column_structure:
            continue
        other_cols = {c.lower() for c in other.column_structure.keys()}
        common = ref_cols & other_cols
        if len(common) >= 1:
            results.append((other.table_name, sorted(common), len(common)))

    if not results:
        return f"Nenhum dataset com colunas em comum com '{table_name}'."

    results.sort(key=lambda x: -x[2])
    lines = [f"Datasets relacionados a '{table_name}':"]
    for tbl, cols, count in results[:10]:
        lines.append(f"  • {tbl} — {count} coluna(s) em comum: {', '.join(cols[:5])}")
    return "\n".join(lines)


# ─── Level 4 — Analysis planner ───────────────────────────────────────────────

def create_analysis_plan(question: str) -> str:
    """
    Para perguntas complexas, gera um plano de análise passo a passo antes de executar.
    Use esta ferramenta PRIMEIRO quando a pergunta envolver múltiplos datasets,
    comparações, tendências temporais ou análises que exigem mais de 3 passos.
    Input: a pergunta do usuário.
    """
    # This tool instructs the agent to plan before acting.
    # The LLM will fill in the actual plan based on context.
    return (
        f"Plano de análise para: '{question}'\n"
        "Por favor, estruture sua resposta seguindo estes passos:\n"
        "1. Identificar quais datasets são relevantes (use search_datasets ou list_tables)\n"
        "2. Obter o schema de cada tabela relevante (use sql_db_schema)\n"
        "3. Verificar a qualidade dos dados se necessário (use detect_data_quality)\n"
        "4. Executar as queries necessárias (use sql_db_query após sql_db_query_checker)\n"
        "5. Fazer análise estatística ou pandas se necessário (use pandas_analysis ou correlation_matrix)\n"
        "6. Gerar visualização se pertinente (use generate_chart)\n"
        "7. Sintetizar todos os resultados em uma resposta clara\n"
        "Execute cada passo na ordem, usando os resultados anteriores para informar os próximos."
    )


# ─── Custom tools (kept for fallback when toolkit tables are empty) ───────────

def list_datasets_fallback(_input: str = "") -> str:
    try:
        datasets = DataImportProcess.objects.filter(
            status__in=["active", "completed"]
        ).values("table_name", "record_count", "column_structure")
        if not datasets:
            return "Nenhum dataset ativo."
        lines = ["Datasets disponíveis:"]
        for ds in datasets:
            cols = list((ds["column_structure"] or {}).keys())[:6]
            lines.append(
                f"  • {ds['table_name']} — {ds['record_count'] or 0:,} registros"
                f" — colunas: {', '.join(cols)}" + (" ..." if len(ds["column_structure"] or {}) > 6 else "")
            )
        return "\n".join(lines)
    except Exception as e:
        return f"Erro: {e}"


def search_datasets_rag(query: str) -> str:
    try:
        from alice.services.vector_service import VectorService
        vs = VectorService()
        results = vs.search_similar_datasets(query=query, limit=4)
        if not results:
            return list_datasets_fallback("")
        lines = ["Datasets semanticamente relevantes:"]
        for r in results:
            ds = r["dataset"]
            lines.append(
                f"  • {ds.table_name} ({r.get('similarity', 0)*100:.0f}% relevância)"
                f" — {ds.record_count or 0:,} registros"
            )
        return "\n".join(lines)
    except Exception as e:
        logger.warning(f"RAG search failed: {e}")
        return list_datasets_fallback("")


# ─── Tool registry ────────────────────────────────────────────────────────────

CUSTOM_TOOLS = [
    Tool(
        name="search_datasets",
        func=search_datasets_rag,
        description=(
            "Busca semanticamente datasets relevantes para a pergunta. "
            "Use para descobrir qual tabela contém os dados desejados. "
            "Input: pergunta em linguagem natural."
        ),
    ),
    Tool(
        name="list_datasets",
        func=list_datasets_fallback,
        description=(
            "Lista todos os datasets ativos com nomes, contagem de registros e colunas. "
            "Use quando não sabe quais tabelas existem. Input: string vazia."
        ),
    ),
    Tool(
        name="pandas_analysis",
        func=pandas_analysis,
        description=(
            "Executa código pandas em um dataset. Use para análises que SQL não cobre: "
            "correlações personalizadas, transformações, estatísticas avançadas. "
            "Input: 'nome_tabela\\ncódigo_python'. O DataFrame está disponível como 'df'. "
            "Exemplo: 'vendas\\nprint(df.groupby(\"categoria\")[\"valor\"].mean())'"
        ),
    ),
    Tool(
        name="generate_chart",
        func=generate_chart,
        description=(
            "Gera um gráfico (bar, line, scatter, hist, pie) a partir de dados. "
            "Retorna a imagem como base64 para exibição no frontend. "
            'Input JSON: {"table": "tabela", "query": "SELECT x, y FROM tabela", '
            '"chart_type": "bar", "x": "coluna_x", "y": "coluna_y", "title": "Título"}'
        ),
    ),
    Tool(
        name="correlation_matrix",
        func=correlation_matrix,
        description=(
            "Calcula correlações de Pearson entre colunas numéricas de uma tabela. "
            "Identifica relações entre variáveis. Input: nome da tabela."
        ),
    ),
    Tool(
        name="detect_data_quality",
        func=detect_data_quality,
        description=(
            "Analisa qualidade dos dados: % de nulos por coluna, duplicatas, "
            "cardinalidade, colunas com tipos suspeitos. "
            "Use antes de análises para entender os dados. Input: nome da tabela."
        ),
    ),
    Tool(
        name="get_value_distribution",
        func=get_value_distribution,
        description=(
            "Distribuição de frequência dos valores de uma coluna (GROUP BY + COUNT). "
            "Essencial para entender variáveis categóricas. "
            "Input: 'nome_tabela,nome_coluna' ou 'nome_tabela,nome_coluna,limite'."
        ),
    ),
    Tool(
        name="find_related_datasets",
        func=find_related_datasets,
        description=(
            "Encontra outros datasets com colunas em comum — candidatos a JOIN. "
            "Use para descobrir relações entre tabelas. Input: nome da tabela de referência."
        ),
    ),
    Tool(
        name="create_analysis_plan",
        func=create_analysis_plan,
        description=(
            "Cria um plano estruturado para análises complexas que envolvem múltiplos passos. "
            "Use ANTES de começar análises com múltiplos datasets, comparações temporais "
            "ou perguntas que exigem mais de 3 ferramentas. Input: a pergunta do usuário."
        ),
    ),
]


# ─── System prompt ────────────────────────────────────────────────────────────

AGENT_SYSTEM_PROMPT = """Você é a Alice, analista de dados sênior do DataDock.
Você tem acesso direto aos dados reais via SQL e Python/pandas.

ESTRATÉGIA DE ANÁLISE:
1. Para perguntas simples: use sql_db_query diretamente após sql_db_schema
2. Para perguntas complexas (múltiplos datasets, tendências, comparações):
   → chame create_analysis_plan primeiro
3. Para entender dados desconhecidos:
   → detect_data_quality → sql_db_schema → get_data_sample
4. Para análises estatísticas:
   → correlation_matrix ou pandas_analysis
5. Para visualização:
   → generate_chart com os dados da query

REGRAS:
- Sempre use sql_db_schema ANTES de escrever SQL (para nomes exatos de colunas)
- Valide SQL com sql_db_query_checker ANTES de executar
- Use aspas duplas em nomes de colunas: SELECT "minha coluna" FROM tabela
- Nunca invente dados — só use o que as ferramentas retornam
- Responda sempre em português brasileiro
- Formate números: 1.234.567
- Use tabelas markdown para dados tabulares
- Se gerar gráfico, mencione que ele será exibido no frontend"""


# ─── Level 3 — Message history from cache ─────────────────────────────────────

def _load_message_history(session_id: str) -> list:
    """Loads last 10 conversation exchanges from cache as LangChain messages."""
    cached = cache.get(f"alice_memory_{session_id}") or []
    messages = []
    for exchange in cached[-10:]:
        messages.append(HumanMessage(content=exchange["human"]))
        messages.append(AIMessage(content=exchange["ai"]))
    return messages


# ─── Agent builder ────────────────────────────────────────────────────────────

def build_agent(session_id: str) -> tuple[Any, list]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your-gemini-api-key-here":
        raise ValueError("GEMINI_API_KEY não configurado")

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        google_api_key=api_key,
        temperature=0.1,
        max_retries=2,
    )

    # Level 1: Official SQLDatabaseToolkit tools (check, list, schema, execute)
    sql_toolkit_tools = _build_sql_toolkit(llm)

    # Merge: custom tools + toolkit tools (toolkit takes precedence for SQL ops)
    all_tools = sql_toolkit_tools + CUSTOM_TOOLS

    # Deduplicate by name (toolkit tools override custom if same name)
    seen: set[str] = set()
    tools: list = []
    for t in all_tools:
        if t.name not in seen:
            seen.add(t.name)
            tools.append(t)

    # Load conversation history from cache
    message_history = _load_message_history(session_id)

    # Build LangGraph ReAct agent
    graph = create_react_agent(
        model=llm,
        tools=tools,
        prompt=AGENT_SYSTEM_PROMPT,
    )

    return graph, message_history


def save_memory_to_cache(
    session_id: str, memory: Any, human_input: str, ai_output: str
) -> None:
    try:
        cached = cache.get(f"alice_memory_{session_id}") or []
        cached.append({"human": human_input, "ai": ai_output})
        cached = cached[-20:]  # Keep last 20 exchanges for summary
        cache.set(f"alice_memory_{session_id}", cached, 60 * 60 * 4)  # 4h TTL
    except Exception as e:
        logger.warning(f"Could not save memory: {e}")
