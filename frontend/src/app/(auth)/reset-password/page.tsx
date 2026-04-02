"use client"

import { useState, FormEvent, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/config"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {}

    if (!password) {
      newErrors.password = "Nova senha é obrigatória"
    } else if (password.length < 8) {
      newErrors.password = "A senha deve ter pelo menos 8 caracteres"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError("")

    if (!token) {
      setSubmitError("Token de redefinição inválido ou ausente. Solicite um novo link.")
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(getApiUrl("/api/auth/reset-password/confirm/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400) {
          setSubmitError(
            data.error ||
            data.token?.[0] ||
            data.password?.[0] ||
            data.detail ||
            "Token inválido ou expirado. Solicite um novo link de redefinição."
          )
        } else if (response.status >= 500) {
          setSubmitError("Erro no servidor. Tente novamente mais tarde.")
        } else {
          setSubmitError(data.error || data.detail || "Falha ao redefinir senha.")
        }
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      setTimeout(() => {
        window.location.href = "/login"
      }, 3000)
    } catch (error) {
      console.error("Reset password error:", error)
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
              Senha redefinida!
            </h1>
            <p className="text-muted-foreground text-sm">
              Sua senha foi alterada com sucesso. Redirecionando para o login...
            </p>
          </div>
          <Button
            className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
            onClick={() => { window.location.href = "/login" }}
          >
            Ir para o Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border rounded-xl shadow-2xl p-8 backdrop-blur-sm bg-white/95 dark:bg-card/95">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            DataDock
          </h1>
          <p className="text-muted-foreground text-sm">
            Defina sua nova senha
          </p>
        </div>

        {!token && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive text-center">
              Link de redefinição inválido. Solicite um novo link de redefinição de senha.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Nova Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua nova senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }))
                }
              }}
              className={cn(
                "h-11 transition-all duration-200",
                errors.password && "border-destructive focus-visible:ring-destructive/20"
              )}
              disabled={isLoading || !token}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-destructive animate-in fade-in-50 duration-200">
                {errors.password}
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
              disabled={isLoading || !token}
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
            disabled={isLoading || !token}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redefinindo...
              </span>
            ) : (
              "Redefinir Senha"
            )}
          </Button>

          <p className="text-center text-sm">
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Voltar para o login
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
