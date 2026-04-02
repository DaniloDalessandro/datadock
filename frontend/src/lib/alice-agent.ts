"use client"

import { getAccessToken } from "@/lib/auth"
import { getApiUrl } from "@/lib/config"

export interface AgentStep {
  tool: string
  input: string
  output: string
}

export interface AgentChart {
  image: string   // base64 PNG
  title: string
}

export interface AgentResponse {
  success: boolean
  response: string
  steps: AgentStep[]
  charts: AgentChart[]
  session_id: string
  timestamp: string
  error?: string
}

export async function askAliceAgent(
  message: string,
  sessionId: string | null
): Promise<AgentResponse> {
  const token = getAccessToken()
  const res = await fetch(getApiUrl("/api/alice/agent/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, session_id: sessionId }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || "Erro ao comunicar com a Alice")
  }

  return data
}

export const TOOL_LABELS: Record<string, string> = {
  // Custom tools
  list_datasets: "Listar datasets",
  search_datasets: "Busca semântica",
  pandas_analysis: "Análise pandas",
  generate_chart: "Gerar gráfico",
  correlation_matrix: "Correlação",
  detect_data_quality: "Qualidade dos dados",
  get_value_distribution: "Distribuição de valores",
  find_related_datasets: "Datasets relacionados",
  create_analysis_plan: "Planejar análise",
  // SQLDatabaseToolkit official tools
  sql_db_list_tables: "Listar tabelas (SQL)",
  sql_db_schema: "Schema SQL",
  sql_db_query: "Executar SQL",
  sql_db_query_checker: "Verificar SQL",
  // Legacy
  get_table_schema: "Schema da tabela",
  get_data_sample: "Amostra de dados",
  execute_sql: "Executar SQL",
  get_column_statistics: "Estatísticas da coluna",
}

export const SUGGESTED_QUESTIONS = [
  "Quais datasets estão disponíveis e quantos registros cada um tem?",
  "Analise a qualidade dos dados do maior dataset",
  "Quais colunas têm correlação entre si?",
  "Mostre a distribuição de valores da coluna principal",
  "Existe algum dataset relacionado que posso cruzar?",
  "Gere um gráfico de barras com os totais por categoria",
]
