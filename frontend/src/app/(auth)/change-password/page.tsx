"use client"

import { useState, FormEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/config"
import { getAccessToken } from "@/lib/auth"
import { AuthCard } from "@/components/auth"
import { Database, Lock, CheckCircle } from "lucide-react"

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

    if (!currentPassword) newErrors.currentPassword = "Senha atual é obrigatória"
    if (!newPassword) newErrors.newPassword = "Nova senha é obrigatória"
    else if (newPassword.length < 8) newErrors.newPassword = "A senha deve ter pelo menos 8 caracteres"
    if (!confirmPassword) newErrors.confirmPassword = "Confirmação de senha é obrigatória"
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = "As senhas não coincidem"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError("")
    if (!validateForm()) return
    setIsLoading(true)

    try {
      const token = getAccessToken()
      const response = await fetch(getApiUrl("/api/auth/change-password/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) { window.location.href = "/login"; return }
        setSubmitError(data.error || data.current_password?.[0] || data.new_password?.[0] || data.detail || "Senha atual incorreta ou nova senha inválida.")
        setIsLoading(false)
        return
      }

      try {
        const rawUserData = localStorage.getItem("user_data")
        if (rawUserData) {
          const userData = JSON.parse(rawUserData)
          userData.must_change_password = false
          localStorage.setItem("user_data", JSON.stringify(userData))
        }
      } catch { /* best-effort */ }

      setIsSuccess(true)
      setTimeout(() => { window.location.href = "/dashboard" }, 2000)
    } catch (error) {
      console.error("Change password error:", error)
      setSubmitError(error instanceof TypeError && error.message.includes("fetch")
        ? "Não foi possível conectar ao servidor."
        : "Ocorreu um erro inesperado.")
      setIsLoading(false)
    }
  }

  const inputStyle = "h-14 transition-all duration-150 bg-white border-[#dddddd] text-[#222222] rounded-[8px] focus-visible:border-[#222222] focus-visible:border-2 focus-visible:ring-0"

  if (isSuccess) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center p-6" style={{ background: "#ffffff" }}>
        <AuthCard>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(39,166,68,0.08)" }}>
              <CheckCircle className="h-6 w-6" style={{ color: "#27a644" }} />
            </div>
            <h1 className="text-xl font-medium tracking-tight mb-2" style={{ color: "#222222" }}>
              Senha alterada!
            </h1>
            <p className="text-sm" style={{ color: "#6a6a6a" }}>
              Redirecionando para o dashboard...
            </p>
          </div>
          <Button
            className="w-full h-14 text-sm font-medium transition-colors duration-150"
            style={{ background: "#ff385c", color: "#fff", borderRadius: "8px" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#e00b41")}
            onMouseLeave={e => (e.currentTarget.style.background = "#ff385c")}
            onClick={() => { window.location.href = "/dashboard" }}
          >
            Ir para o Dashboard
          </Button>
        </AuthCard>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6" style={{ background: "#ffffff" }}>
      <AuthCard>
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(255,56,92,0.06)" }}>
            <Database className="h-6 w-6" style={{ color: "#ff385c" }} />
          </div>
          <h1 className="text-xl font-medium tracking-tight mb-1" style={{ color: "#222222" }}>
            DataDock
          </h1>
          <p className="text-sm" style={{ color: "#6a6a6a" }}>
            Defina uma nova senha para sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium" style={{ color: "#222222" }}>
              Senha Atual
            </Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Digite sua senha atual"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); if (errors.currentPassword) setErrors(p => ({ ...p, currentPassword: undefined })) }}
              className={cn(inputStyle, errors.currentPassword && "border-[#c13515] focus-visible:border-[#c13515]")}
              disabled={isLoading}
              aria-invalid={!!errors.currentPassword}
            />
            {errors.currentPassword && <p className="text-xs animate-in fade-in-50" style={{ color: "#c13515" }}>{errors.currentPassword}</p>}
          </div>

          {/* New password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium" style={{ color: "#222222" }}>
              Nova Senha
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(p => ({ ...p, newPassword: undefined })) }}
              className={cn(inputStyle, errors.newPassword && "border-[#c13515] focus-visible:border-[#c13515]")}
              disabled={isLoading}
              aria-invalid={!!errors.newPassword}
            />
            {errors.newPassword && <p className="text-xs animate-in fade-in-50" style={{ color: "#c13515" }}>{errors.newPassword}</p>}
          </div>

          {/* Confirm */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: "#222222" }}>
              Confirmar Nova Senha
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: undefined })) }}
              className={cn(inputStyle, errors.confirmPassword && "border-[#c13515] focus-visible:border-[#c13515]")}
              disabled={isLoading}
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
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = "#e00b41" }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = "#ff385c" }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Alterando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Alterar Senha
              </span>
            )}
          </Button>
        </form>
      </AuthCard>
    </div>
  )
}
