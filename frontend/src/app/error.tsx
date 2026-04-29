"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.error("Erro da aplicação:", error)
    if (!isAuthenticated) {
      const timer = setTimeout(() => { router.push("/login") }, 2000)
      return () => clearTimeout(timer)
    }
  }, [error, isAuthenticated, router])

  const btnPrimary: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "100%", height: "48px", fontSize: "16px", fontWeight: 500,
    background: "#ff385c", color: "#fff", borderRadius: "8px", border: "none", cursor: "pointer",
    transition: "background 150ms",
  }
  const btnOutline: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "100%", height: "48px", fontSize: "16px", fontWeight: 500,
    background: "#ffffff", color: "#222222",
    borderRadius: "8px", border: "1px solid #dddddd", cursor: "pointer",
    transition: "background 150ms",
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f7f7f7]">
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="flex justify-center">
          <div className="p-4 rounded-[14px]" style={{ background: "rgba(193,53,21,0.08)", border: "1px solid rgba(193,53,21,0.15)" }}>
            <AlertCircle className="h-10 w-10" style={{ color: "#c13515" }} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-[#c13515]">Oops!</h1>
          <h2 className="text-xl font-semibold text-[#222222]">Algo deu errado</h2>
          <p className="text-sm text-[#6a6a6a]">
            Ocorreu um erro inesperado na aplicação.
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="text-left p-3 rounded-[8px] mt-3 bg-[#f2f2f2] border border-[#dddddd] text-xs text-[#6a6a6a]">
              <strong className="text-[#3f3f3f]">Erro:</strong> {error.message}
              {error.digest && <><br /><strong className="text-[#3f3f3f]">ID:</strong> {error.digest}</>}
            </div>
          )}
        </div>
        <div className="space-y-3">
          {isAuthenticated ? (
            <>
              <button onClick={reset} style={btnPrimary}>Tentar novamente</button>
              <button onClick={() => router.push("/dashboard")} style={btnOutline}>Voltar ao Dashboard</button>
            </>
          ) : (
            <>
              <p className="text-xs text-[#929292]">
                Você será redirecionado para o login...
              </p>
              <button onClick={() => router.push("/login")} style={btnPrimary}>Ir para Login</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
