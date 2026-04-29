"use client"

import { useState, FormEvent, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/config"
import { AuthCard } from "@/components/auth"
import { Database, CheckCircle } from "lucide-react"

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
    if (!password) newErrors.password = "Nova senha é obrigatória"
    else if (password.length < 8) newErrors.password = "A senha deve ter pelo menos 8 caracteres"
    if (!confirmPassword) newErrors.confirmPassword = "Confirmação de senha é obrigatória"
    else if (password !== confirmPassword) newErrors.confirmPassword = "As senhas não coincidem"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError("")
    if (!token) { setSubmitError("Token de redefinição inválido ou ausente. Solicite um novo link."); return }
    if (!validateForm()) return
    setIsLoading(true)

    try {
      const response = await fetch(getApiUrl("/api/auth/reset-password/confirm/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setSubmitError(data.error || data.token?.[0] || data.password?.[0] || data.detail || "Token inválido ou expirado.")
        setIsLoading(false)
        return
      }
      setIsSuccess(true)
      setTimeout(() => { window.location.href = "/login" }, 3000)
    } catch (error) {
      console.error("Reset password error:", error)
      setSubmitError(error instanceof TypeError && error.message.includes("fetch")
        ? "Não foi possível conectar ao servidor."
        : "Ocorreu um erro inesperado.")
      setIsLoading(false)
    }
  }

  const inputStyle = "h-14 transition-all duration-150 bg-white border-[#dddddd] text-[#222222] rounded-[8px] focus-visible:border-[#222222] focus-visible:border-2 focus-visible:ring-0"

  if (isSuccess) {
    return (
      <AuthCard>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(39,166,68,0.08)" }}>
            <CheckCircle className="h-6 w-6" style={{ color: "#27a644" }} />
          </div>
          <h1 className="text-xl font-medium mb-2" style={{ color: "#222222" }}>Senha redefinida!</h1>
          <p className="text-sm" style={{ color: "#6a6a6a" }}>
            Redirecionando para o login...
          </p>
        </div>
        <Button
          className="w-full h-14 text-sm font-medium transition-colors duration-150"
          style={{ background: "#ff385c", color: "#fff", borderRadius: "8px" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#e00b41")}
          onMouseLeave={e => (e.currentTarget.style.background = "#ff385c")}
          onClick={() => { window.location.href = "/login" }}
        >
          Ir para o Login
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(255,56,92,0.06)" }}>
          <Database className="h-6 w-6" style={{ color: "#ff385c" }} />
        </div>
        <h1 className="text-xl font-medium mb-1" style={{ color: "#222222" }}>DataDock</h1>
        <p className="text-sm" style={{ color: "#6a6a6a" }}>Defina sua nova senha</p>
      </div>

      {!token && (
        <div className="mb-6 rounded-[8px] p-3" style={{ background: "rgba(193,53,21,0.06)", border: "1px solid rgba(193,53,21,0.20)" }}>
          <p className="text-sm text-center" style={{ color: "#c13515" }}>
            Link de redefinição inválido. Solicite um novo link.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium" style={{ color: "#222222" }}>Nova Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })) }}
            className={cn(inputStyle, errors.password && "border-[#c13515] focus-visible:border-[#c13515]")}
            disabled={isLoading || !token}
            aria-invalid={!!errors.password}
          />
          {errors.password && <p className="text-xs animate-in fade-in-50" style={{ color: "#c13515" }}>{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: "#222222" }}>Confirmar Nova Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repita a nova senha"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: undefined })) }}
            className={cn(inputStyle, errors.confirmPassword && "border-[#c13515] focus-visible:border-[#c13515]")}
            disabled={isLoading || !token}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && <p className="text-xs animate-in fade-in-50" style={{ color: "#c13515" }}>{errors.confirmPassword}</p>}
        </div>

        {submitError && (
          <div className="rounded-[8px] p-3 animate-in fade-in-50" style={{ background: "rgba(193,53,21,0.06)", border: "1px solid rgba(193,53,21,0.20)" }}>
            <p className="text-sm text-center" style={{ color: "#c13515" }}>{submitError}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-14 text-sm font-medium transition-colors duration-150"
          style={{ background: "#ff385c", color: "#fff", borderRadius: "8px" }}
          onMouseEnter={e => { if (!isLoading && token) e.currentTarget.style.background = "#e00b41" }}
          onMouseLeave={e => { if (!isLoading && token) e.currentTarget.style.background = "#ff385c" }}
          disabled={isLoading || !token}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redefinindo...
            </span>
          ) : "Redefinir Senha"}
        </Button>

        <p className="text-center text-sm">
          <a href="/login" className="transition-colors" style={{ color: "#ff385c" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#e00b41")}
            onMouseLeave={e => (e.currentTarget.style.color = "#ff385c")}
          >
            Voltar para o login
          </a>
        </p>
      </form>
    </AuthCard>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6" style={{ background: "#ffffff" }}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "#dddddd", borderTopColor: "#ff385c" }} />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
