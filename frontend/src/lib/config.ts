/**
 * Configuração centralizada de variáveis de ambiente
 * Todas as URLs de API e configurações externas devem ser definidas aqui
 */

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
} as const

export function getApiUrl(endpoint: string): string {
  // Remove barra inicial se presente para evitar barras duplicadas
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${config.apiUrl}${cleanEndpoint}`
}
