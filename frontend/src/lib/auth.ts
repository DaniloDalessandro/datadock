/**
 * Funções utilitárias de autenticação
 * Gerencia armazenamento, validação, renovação e logout de tokens
 */

import { config } from "./config"

const API_BASE_URL = config.apiUrl

export interface UserData {
  id: number
  email: string
  first_name: string
  last_name: string
  profile_type?: string
  is_superuser?: boolean
}

export interface AuthTokens {
  access: string
  refresh: string
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token")
}

export function getUserData(): UserData | null {
  if (typeof window === "undefined") return null
  const userData = localStorage.getItem("user_data")
  if (!userData) return null
  try {
    return JSON.parse(userData)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

export function setAuthTokens(tokens: Partial<AuthTokens>): void {
  if (tokens.access) {
    localStorage.setItem("access_token", tokens.access)
  }
  if (tokens.refresh) {
    localStorage.setItem("refresh_token", tokens.refresh)
  }
}

export function setUserData(userData: UserData): void {
  localStorage.setItem("user_data", JSON.stringify(userData))
}

export function clearAuthData(): void {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("user_data")
}

export function logout(): void {
  clearAuthData()
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

/**
 * Renova o access token usando o refresh token
 * @returns Novo access token ou null se a renovação falhar
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    console.warn("[Auth] No refresh token available")
    return null
  }

  console.log("[Auth] Attempting to refresh access token...")

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      // Refresh token inválido ou expirado - limpa tokens e força novo login
      const errorData = await response.json().catch(() => ({}))
      console.error("[Auth] Token refresh failed:", response.status, errorData)
      clearAuthData()
      return null
    }

    const data = await response.json()

    if (data.access) {
      localStorage.setItem("access_token", data.access)
      console.log("[Auth] Access token refreshed successfully")
      return data.access
    }

    console.error("[Auth] No access token in refresh response")
    return null
  } catch (error) {
    console.error("[Auth] Error refreshing token:", error)
    return null
  }
}

/**
 * Faz requisição autenticada com renovação automática de token em caso de 401
 * @param url - URL do endpoint da API
 * @param options - Opções do fetch
 * @returns Objeto Response
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error("No access token available")
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  }

  let response = await fetch(url, { ...options, headers })

  // Retry automático com refresh de token se receber 401
  if (response.status === 401) {
    const newToken = await refreshAccessToken()

    if (newToken) {
      const refreshedHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      }
      response = await fetch(url, { ...options, headers: refreshedHeaders })
    } else {
      logout()
      throw new Error("Session expired. Please login again.")
    }
  }

  return response
}

/**
 * Decodifica JWT token para obter timestamp de expiração
 * @param token - JWT token
 * @returns Timestamp de expiração ou null
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    const payload = JSON.parse(jsonPayload)
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/**
 * Verifica se o token está expirado ou prestes a expirar
 * @param token - JWT token
 * @param bufferMinutes - Minutos antes da expiração para considerar token como expirado (padrão: 5)
 * @returns True se o token está expirado ou vai expirar em breve
 */
export function isTokenExpired(token: string, bufferMinutes: number = 5): boolean {
  const expiration = getTokenExpiration(token)
  if (!expiration) return true

  const now = Date.now()
  const buffer = bufferMinutes * 60 * 1000
  return now >= expiration - buffer
}

/**
 * Verifica se o access token precisa ser renovado
 * @returns True se o token deve ser renovado
 */
export function shouldRefreshToken(): boolean {
  const accessToken = getAccessToken()
  if (!accessToken) return false
  return isTokenExpired(accessToken)
}
