"use client"

import { useState, FormEvent } from "react"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/config"
import {
  Database,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
} from "lucide-react"

interface ModernLoginFormProps {
  className?: string
}

export function ModernLoginForm({ className }: ModernLoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
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

      if (data.user?.must_change_password) {
        window.location.href = "/change-password"
      } else {
        window.location.href = "/dashboard"
      }
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

  // Airbnb input style: white bg, hairline border, 8px radius, 56px height
  const inputBase: React.CSSProperties = {
    width: "100%",
    height: "56px",
    paddingLeft: "2.75rem",
    paddingRight: "1rem",
    fontSize: "16px",
    color: "#222222",
    background: "#ffffff",
    border: "1px solid #dddddd",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 150ms",
    fontFamily: "inherit",
  }

  const emailInputStyle = (): React.CSSProperties => ({
    ...inputBase,
    ...(errors.email
      ? { border: "2px solid #c13515" }
      : emailFocused
      ? { border: "2px solid #222222" }
      : {}),
  })

  const passwordInputStyle = (): React.CSSProperties => ({
    ...inputBase,
    paddingRight: "2.75rem",
    ...(errors.password
      ? { border: "2px solid #c13515" }
      : passwordFocused
      ? { border: "2px solid #222222" }
      : {}),
  })

  return (
    <div
      className={cn("w-full login-form-in", className)}
      style={{ fontFeatureSettings: '"cv01", "ss03"' }}
    >
      {/* ── Brand header ── */}
      <div className="mb-8">
        {/* Logo mark — visible on mobile only */}
        <div className="flex items-center gap-2.5 mb-6 lg:hidden">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            style={{
              background: "rgba(255,56,92,0.10)",
              border: "1px solid rgba(255,56,92,0.20)",
            }}
          >
            <Database className="w-4 h-4" style={{ color: "#ff385c" }} />
          </div>
          <span
            className="text-base tracking-tight font-semibold"
            style={{ color: "#222222", letterSpacing: "-0.02em" }}
          >
            DataDock
          </span>
        </div>

        {/* Heading */}
        <h1
          className="mb-1.5 leading-tight"
          style={{
            color: "#222222",
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "-0.044rem",
          }}
        >
          Bem-vindo de volta
        </h1>
        <p className="text-sm" style={{ color: "#6a6a6a" }}>
          Entre na sua conta para continuar
        </p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Email field */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="email"
            className="block"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#3f3f3f",
              marginBottom: "6px",
            }}
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Mail
                className="w-4 h-4 transition-colors duration-150"
                style={{
                  color: errors.email ? "#c13515" : emailFocused ? "#222222" : "#929292",
                }}
              />
            </div>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
              }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={emailInputStyle()}
              disabled={isLoading}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </div>
          {errors.email && (
            <p
              id="email-error"
              className="flex items-center gap-1.5 animate-in fade-in-50 duration-150"
              style={{ color: "#c13515", fontSize: "12px", marginTop: "5px" }}
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password field */}
        <div style={{ marginBottom: "8px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: "6px" }}>
            <label
              htmlFor="password"
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#3f3f3f",
              }}
            >
              Senha
            </label>
            <a
              href="/reset-password"
              className="transition-colors duration-150 underline"
              style={{ fontSize: "13px", color: "#428bff" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#2166cc" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#428bff" }}
            >
              Esqueceu a senha?
            </a>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Lock
                className="w-4 h-4 transition-colors duration-150"
                style={{
                  color: errors.password ? "#c13515" : passwordFocused ? "#222222" : "#929292",
                }}
              />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              style={passwordInputStyle()}
              disabled={isLoading}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                color: "#929292",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#222222" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#929292" }}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword
                ? <EyeOff className="w-4 h-4" />
                : <Eye    className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p
              id="password-error"
              className="flex items-center gap-1.5 animate-in fade-in-50 duration-150"
              style={{ color: "#c13515", fontSize: "12px", marginTop: "5px" }}
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Login error banner */}
        {loginError && (
          <div
            className="flex items-start gap-2.5 animate-in fade-in-50 duration-200"
            style={{
              background: "rgba(193,53,21,0.06)",
              border: "1px solid rgba(193,53,21,0.20)",
              borderRadius: "8px",
              padding: "10px 12px",
              marginTop: "16px",
            }}
          >
            <AlertCircle
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: "#c13515" }}
            />
            <p style={{ fontSize: "13px", color: "#c13515", lineHeight: 1.5 }}>
              {loginError}
            </p>
          </div>
        )}

        {/* Submit button — Rausch primary */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 transition-all duration-150"
          style={{
            height: "48px",
            marginTop: "20px",
            background: isLoading ? "rgba(255,56,92,0.65)" : "#ff385c",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: 500,
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.background = "#e00b41"
          }}
          onMouseLeave={(e) => {
            if (!isLoading) e.currentTarget.style.background = "#ff385c"
          }}
          onMouseDown={(e) => {
            if (!isLoading) e.currentTarget.style.background = "#c00030"
          }}
          onMouseUp={(e) => {
            if (!isLoading) e.currentTarget.style.background = "#e00b41"
          }}
        >
          {isLoading ? (
            <>
              <span
                className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
                style={{
                  borderColor: "rgba(255,255,255,0.30)",
                  borderTopColor: "#ffffff",
                }}
              />
              Entrando...
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* ── Footer — legal links ── */}
      <p
        className="mt-8 text-center"
        style={{ fontSize: "12px", color: "#929292", lineHeight: 1.6 }}
      >
        Ao continuar, você concorda com os{" "}
        <a
          href="#"
          className="underline transition-colors duration-150"
          style={{ color: "#428bff" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#2166cc" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#428bff" }}
        >
          Termos de Serviço
        </a>{" "}
        e à{" "}
        <a
          href="#"
          className="underline transition-colors duration-150"
          style={{ color: "#428bff" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#2166cc" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#428bff" }}
        >
          Política de Privacidade
        </a>
      </p>
    </div>
  )
}
