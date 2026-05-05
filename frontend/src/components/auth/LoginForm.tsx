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
    if (!email) newErrors.email = "Email é obrigatório"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email inválido"
    if (!password) newErrors.password = "Senha é obrigatória"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginError("")
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const response = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) setLoginError("Email ou senha incorretos.")
        else if (response.status === 403) setLoginError(data.error || "Acesso negado.")
        else if (response.status >= 500) setLoginError("Erro no servidor. Tente mais tarde.")
        else setLoginError(data.error || data.message || "Falha no login.")
        setIsLoading(false)
        return
      }
      if (data.access || data.token) localStorage.setItem("access_token", data.access || data.token)
      if (data.refresh) localStorage.setItem("refresh_token", data.refresh)
      if (data.user) localStorage.setItem("user_data", JSON.stringify(data.user))
      window.location.href = "/dashboard"
    } catch {
      setLoginError("Não foi possível conectar ao servidor.")
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("w-full max-w-sm", className)}>
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-3 mb-12">
        <div className="w-9 h-9 bg-[#1d1d1f] rounded-[8px] flex items-center justify-center">
          <span className="font-semibold text-[#ffffff] text-base">D</span>
        </div>
        <span className="text-[#1d1d1f] font-semibold text-xl tracking-[-0.374px]">DataDock</span>
      </div>

      <div className="mb-10">
        <h2 className="text-[40px] font-semibold text-[#1d1d1f] leading-[1.10] mb-3 tracking-[-0.28px]">
          Entrar
        </h2>
        <p className="text-[#7a7a7a] text-[17px] leading-[1.47] tracking-[-0.374px]">
          Acesse sua conta para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-[#1d1d1f]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors(p => ({ ...p, email: undefined }))
            }}
            variant={errors.email ? "error" : "default"}
            disabled={isLoading}
          />
          {errors.email && <p className="text-[14px] text-[#cc0000] tracking-[-0.224px]">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-[#1d1d1f]">
              Senha
            </Label>
            <a href="#" className="text-[14px] text-[#0066cc] hover:text-[#0071e3] transition-colors tracking-[-0.224px]">
              Esqueceu?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors(p => ({ ...p, password: undefined }))
            }}
            variant={errors.password ? "error" : "default"}
            disabled={isLoading}
          />
          {errors.password && <p className="text-[14px] text-[#cc0000] tracking-[-0.224px]">{errors.password}</p>}
        </div>

        {loginError && (
          <div className="border border-[#cc0000] bg-[#cc0000]/5 p-4 rounded-[8px]">
            <p className="text-[14px] text-[#cc0000] tracking-[-0.224px]">{loginError}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-[#ffffff]/30 border-t-[#ffffff] rounded-full animate-spin" />
              Entrando...
            </span>
          ) : "Entrar"}
        </Button>
      </form>

      <p className="mt-8 text-[12px] text-[#7a7a7a] leading-[1.3] tracking-[-0.12px]">
        Ao entrar, você concorda com os{" "}
        <a href="#" className="text-[#0066cc] hover:text-[#0071e3]">
          Termos de Serviço
        </a>
        {" "}e{" "}
        <a href="#" className="text-[#0066cc] hover:text-[#0071e3]">
          Política de Privacidade
        </a>
      </p>
    </div>
  )
}
