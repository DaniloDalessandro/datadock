"use client"

import { getAccessToken } from "@/lib/auth"
import { getApiUrl } from "@/lib/config"

export interface AgentStep {
  tool: string
  input: string
  output: string
}

export interface AgentResponse {
  success: boolean
  response: string
  steps: AgentStep[]
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
  list_datasets: "Listar datasets",
  search_datasets: "Busca semântica",
  get_table_schema: "Schema da tabela",
  get_data_sample: "Amostra de dados",
  execute_sql: "Executar SQL",
  get_column_statistics: "Estatísticas da coluna",
}

export const SUGGESTED_QUESTIONS = [
  "Quais datasets estão disponíveis no sistema?",
  "Quantos registros existem em cada dataset?",
  "Mostre uma amostra dos dados do dataset mais recente",
  "Quais são as colunas disponíveis no maior dataset?",
  "Faça uma análise estatística das colunas numéricas",
  "Quais datasets foram importados este mês?",
]
