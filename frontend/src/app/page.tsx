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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    </div>
  )
}