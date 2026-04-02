"use client"

import { useState, FormEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/config"
import { getAccessToken } from "@/lib/auth"

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      window.location.href = "/login"
    }
  }, [])

  const validateForm = () => {
    const newErrors: {
      currentPassword?: string
      newPassword?: string
      confirmPassword?: string
    } = {}

    if (!currentPassword) {
      newErrors.currentPassword = "Senha atual é obrigatória"
    }

    if (!newPassword) {
      newErrors.newPassword = "Nova senha é obrigatória"
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "A senha deve ter pelo menos 8 caracteres"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const token = getAccessToken()

      const response = await fetch(getApiUrl("/api/auth/change-password/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400) {
          setSubmitError(
            data.error ||
            data.current_password?.[0] ||
            data.new_password?.[0] ||
            data.detail ||
            "Senha atual incorreta ou nova senha inválida."
          )
        } else if (response.status === 401) {
          window.location.href = "/login"
          return
        } else if (response.status >= 500) {
          setSubmitError("Erro no servidor. Tente novamente mais tarde.")
        } else {
          setSubmitError(data.error || data.detail || "Falha ao alterar senha.")
        }
        setIsLoading(false)
        return
      }

      // Clear must_change_password flag from stored user data
      try {
        const rawUserData = localStorage.getItem("user_data")
        if (rawUserData) {
          const userData = JSON.parse(rawUserData)
          userData.must_change_password = false
          localStorage.setItem("user_data", JSON.stringify(userData))
        }
      } catch {
        // Ignore parse errors - the flag update is best-effort
      }

      setIsSuccess(true)
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 2000)
    } catch (error) {
      console.error("Change password error:", error)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setSubmitError("Não foi possível conectar ao servidor. Verifique sua conexão.")
      } else {
        setSubmitError("Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.")
      }
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md">
          <div className="bg-card border rounded-xl shadow-2xl p-8 backdrop-blur-sm bg-white/95 dark:bg-card/95">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">
                Senha alterada!
              </h1>
              <p className="text-muted-foreground text-sm">
                Sua senha foi alterada com sucesso. Redirecionando para o dashboard...
              </p>
            </div>
            <Button
              className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={() => { window.location.href = "/dashboard" }}
            >
              Ir para o Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-card border rounded-xl shadow-2xl p-8 backdrop-blur-sm bg-white/95 dark:bg-card/95">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              DataDock
            </h1>
            <p className="text-muted-foreground text-sm">
              Defina uma nova senha para sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">
                Senha Atual
              </Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Digite sua senha atual"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value)
                  if (errors.currentPassword) {
                    setErrors((prev) => ({ ...prev, currentPassword: undefined }))
                  }
                }}
                className={cn(
                  "h-11 transition-all duration-200",
                  errors.currentPassword && "border-destructive focus-visible:ring-destructive/20"
                )}
                disabled={isLoading}
                aria-invalid={!!errors.currentPassword}
              />
              {errors.currentPassword && (
                <p className="text-sm text-destructive animate-in fade-in-50 duration-200">
                  {errors.currentPassword}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">
                Nova Senha
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Digite sua nova senha"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (errors.newPassword) {
                    setErrors((prev) => ({ ...prev, newPassword: undefined }))
                  }
                }}
                className={cn(
                  "h-11 transition-all duration-200",
                  errors.newPassword && "border-destructive focus-visible:ring-destructive/20"
                )}
                disabled={isLoading}
                aria-invalid={!!errors.newPassword}
              />
              {errors.newPassword && (
                <p className="text-sm text-destructive animate-in fade-in-50 duration-200">
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar Nova Senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                  }
                }}
                className={cn(
                  "h-11 transition-all duration-200",
                  errors.confirmPassword && "border-destructive focus-visible:ring-destructive/20"
                )}
                disabled={isLoading}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive animate-in fade-in-50 duration-200">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {submitError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 animate-in fade-in-50 duration-200">
                <p className="text-sm text-destructive text-center">{submitError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Alterando...
                </span>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
