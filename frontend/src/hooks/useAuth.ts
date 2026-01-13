"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  isAuthenticated,
  getUserData,
  logout,
  shouldRefreshToken,
  refreshAccessToken,
  type UserData,
} from "@/lib/auth"

interface UseAuthReturn {
  isAuthenticated: boolean
  isLoading: boolean
  user: UserData | null
  logout: () => void
  refreshToken: () => Promise<boolean>
}

/**
 * Hook customizado para gerenciar estado de autenticação
 * Fornece dados do usuário, status de autenticação e funções relacionadas
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter()
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      setIsAuth(authenticated)

      if (authenticated) {
        const userData = getUserData()
        setUser(userData)
      } else {
        setUser(null)
      }

      setIsAuthChecking(false)
    }

    checkAuth()

    // Revalida quando o storage muda (sincronização entre abas do navegador)
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "access_token" ||
        e.key === "refresh_token" ||
        e.key === "user_data"
      ) {
        checkAuth()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleLogout = () => {
    logout()
    setIsAuth(false)
    setUser(null)
  }

  const handleRefreshToken = async (): Promise<boolean> => {
    if (!shouldRefreshToken()) {
      return true
    }

    const newToken = await refreshAccessToken()
    if (!newToken) {
      handleLogout()
      return false
    }

    return true
  }

  return {
    isAuthenticated: isAuth,
    isLoading: isAuthChecking,
    user,
    logout: handleLogout,
    refreshToken: handleRefreshToken,
  }
}

/**
 * Hook que redireciona para login se o usuário não estiver autenticado
 * Use em páginas que requerem autenticação
 */
export function useRequireAuth(): UseAuthReturn {
  const router = useRouter()
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push("/login")
    }
  }, [auth.isLoading, auth.isAuthenticated, router])

  return auth
}

/**
 * Hook que redireciona para dashboard se o usuário já estiver autenticado
 * Use em páginas de login/cadastro
 */
export function useRedirectIfAuthenticated(redirectTo: string = "/dashboard") {
  const router = useRouter()
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      router.push(redirectTo)
    }
  }, [auth.isLoading, auth.isAuthenticated, router, redirectTo])

  return auth
}
