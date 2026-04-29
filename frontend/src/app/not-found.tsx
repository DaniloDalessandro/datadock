"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Database } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      const timer = setTimeout(() => { router.push("/login") }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, router])

  const btnPrimary: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "100%", height: "44px", fontSize: "14px", fontWeight: 500,
    background: "#5e6ad2", color: "#fff", borderRadius: "6px", border: "none", cursor: "pointer",
    transition: "opacity 150ms",
  }
  const btnOutline: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "100%", height: "44px", fontSize: "14px", fontWeight: 500,
    background: "rgba(255,255,255,0.02)", color: "#d0d6e0",
    borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
    transition: "background 150ms",
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#08090a" }}>
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl" style={{ background: "rgba(94,106,210,0.12)" }}>
            <Database className="h-10 w-10" style={{ color: "#5e6ad2" }} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-7xl font-bold" style={{ color: "#5e6ad2" }}>404</h1>
          <h2 className="text-xl font-medium" style={{ color: "#f7f8f8" }}>Página não encontrada</h2>
          <p style={{ color: "#8a8f98", fontSize: "14px" }}>
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        <div className="space-y-3">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" style={btnPrimary}>Voltar ao Dashboard</Link>
              <Link href="javascript:history.back()" style={btnOutline}>Voltar à página anterior</Link>
            </>
          ) : (
            <>
              <p style={{ color: "#62666d", fontSize: "13px" }}>
                Você será redirecionado para o login em alguns segundos...
              </p>
              <Link href="/login" style={btnPrimary}>Ir para Login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
