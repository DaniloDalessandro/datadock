"use client"

import { useState, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/config"

interface ModernLoginFormProps {
  className?: string
}

export function ModernLoginForm({ className }: ModernLoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = "Email é obrigatório"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Por favor, insira um email válido"
    }

    if (!password) {
      newErrors.password = "Senha é obrigatória"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setLoginError("Email ou senha incorretos. Por favor, tente novamente.")
        } else if (response.status === 403) {
          setLoginError(data.error || "Acesso negado. Conta pode estar inativa.")
        } else if (response.status >= 500) {
          setLoginError("Erro no servidor. Tente novamente mais tarde.")
        } else {
          setLoginError(data.error || data.message || "Falha no login. Verifique suas credenciais.")
        }
        setIsLoading(false)
        return
      }

      if (data.access || data.token) {
        const accessToken = data.access || data.token
        localStorage.setItem("access_token", accessToken)
      }

      if (data.refresh) {
        localStorage.setItem("refresh_token", data.refresh)
      }

      if (data.user) {
        localStorage.setItem("user_data", JSON.stringify(data.user))
      }

      window.location.href = "/dashboard"
    } catch (error) {
      console.error("Login error:", error)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setLoginError("Não foi possível conectar ao servidor. Verifique sua conexão.")
      } else {
        setLoginError("Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.")
      }
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className="bg-card border rounded-xl shadow-2xl p-8 backdrop-blur-sm bg-white/95 dark:bg-card/95">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            DataDock
          </h1>
          <p className="text-muted-foreground text-sm">
            Entre na sua conta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }))
                }
              }}
              className={cn(
                "h-11 transition-all duration-200",
                errors.email && "border-destructive focus-visible:ring-destructive/20"
              )}
              disabled={isLoading}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive animate-in fade-in-50 duration-200">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <a
                href="#"
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Esqueceu a senha?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
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
              disabled={isLoading}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-destructive animate-in fade-in-50 duration-200">
                {errors.password}
              </p>
            )}
          </div>

          {loginError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 animate-in fade-in-50 duration-200">
              <p className="text-sm text-destructive text-center">{loginError}</p>
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
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Ao entrar, você concorda com nossos{" "}
        <a href="#" className="underline hover:text-foreground transition-colors">
          Termos de Serviço
        </a>{" "}
        e{" "}
        <a href="#" className="underline hover:text-foreground transition-colors">
          Política de Privacidade
        </a>
      </p>
    </div>
  )
}
