"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (token) {
      router.push("/dashboard")
    } else {
      router.push("/home")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#08090a" }}>
      <div className="text-center">
        <div
          className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin mx-auto"
          style={{ borderColor: "rgba(255,255,255,0.08)", borderTopColor: "#5e6ad2" }}
        />
        <p className="mt-4 text-sm" style={{ color: "#62666d" }}>Carregando...</p>
      </div>
    </div>
  )
}
