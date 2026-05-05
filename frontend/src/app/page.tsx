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
    <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#e6e6e6] border-t-[#000000] rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-[#6b6b6b] text-sm font-bold uppercase tracking-widest">Carregando...</p>
      </div>
    </div>
  )
}
