"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { Bot, Send, User, Info } from "lucide-react"
import { config } from "@/lib/config"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function AlicePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, refreshToken } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá! Sou a **Alice**, sua assistente virtual do DataDock. Estou aqui para ajudar você a entender e analisar os dados dos seus datasets.\n\nPosso responder perguntas sobre:\n- Volume e armazenamento de dados\n- Tendências e crescimento\n- Status dos datasets\n- Insights e recomendações\n\nComo posso ajudar você hoje?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (rateLimitCooldown > 0) {
      const timer = setTimeout(() => setRateLimitCooldown(rateLimitCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [rateLimitCooldown])

  const callAliceAPI = async (message: string): Promise<string> => {
    try {
      const tokenRefreshed = await refreshToken()
      if (!tokenRefreshed) {
        router.push("/login")
        throw new Error("Sessão expirada. Faça login novamente.")
      }
      const token = localStorage.getItem("access_token")
      if (!token) {
        router.push("/login")
        throw new Error("Token não encontrado.")
      }
      const response = await fetch(`${config.apiUrl}/api/alice/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      })
      const data = await response.json()
      if (response.status === 401) {
        router.push("/login")
        throw new Error("Sessão expirada.")
      }
      if (response.status === 429) {
        setRateLimitCooldown(60)
        throw new Error("Muitas requisições. Aguarde 60 segundos.")
      }
      if (!response.ok) throw new Error(data.error || "Erro ao processar pergunta")
      if (data.success) return data.response
      throw new Error(data.error || "Erro desconhecido")
    } catch (error) {
      return `Desculpe, ocorreu um erro: ${error instanceof Error ? error.message : "Tente novamente."}`
    }
  }

  const handleSend = async () => {
    if (!input.trim() || rateLimitCooldown > 0) return
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }
    const messageText = input
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)
    try {
      const response = await callAliceAPI(messageText)
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: response, timestamp: new Date() },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickQuestions = [
    "Quantos datasets temos?",
    "Como está o armazenamento?",
    "Qual a tendência de crescimento?",
    "Me dê recomendações",
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="h-6 w-6 text-[#1d1d1f] animate-pulse" />
          </div>
          <p className="text-sm text-[#7a7a7a] font-medium">Carregando Alice...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header — dark tile */}
      <div className="bg-[#272729] px-8 py-5 flex items-center gap-4 flex-shrink-0">
        <div className="w-10 h-10 bg-[#ffffff]/10 rounded-[8px] flex items-center justify-center flex-shrink-0">
          <Bot className="h-5 w-5 text-[#ffffff]" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[21px] font-semibold text-[#ffffff] leading-none tracking-[0.231px]">
              Alice
            </h1>
            <Badge variant="navy" className="text-xs bg-[#0066cc] text-[#ffffff]">IA</Badge>
          </div>
          <p className="text-[12px] text-[#cccccc] mt-1 tracking-[-0.12px]">Assistente Virtual de Análise de Dados</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#ffffff]">
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "assistant"
                      ? "bg-[#272729]"
                      : "bg-[#f5f5f7] border border-[#e0e0e0]"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-[#ffffff]" />
                  ) : (
                    <User className="h-4 w-4 text-[#1d1d1f]" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`flex-1 max-w-[78%] ${message.role === "user" ? "text-right" : "text-left"}`}>
                  <div
                    className={`inline-block p-4 text-[17px] tracking-[-0.374px] leading-[1.47] rounded-[18px] ${
                      message.role === "user"
                        ? "bg-[#0066cc] text-[#ffffff] rounded-tr-[4px]"
                        : "bg-[#f5f5f7] text-[#1d1d1f] border border-[#e0e0e0] rounded-tl-[4px]"
                    }`}
                    style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
                  >
                    {message.content.split("**").map((part, i) =>
                      i % 2 === 0 ? part : <strong key={i}>{part}</strong>
                    )}
                  </div>
                  <div className={`text-xs text-[#7a7a7a] mt-1 ${message.role === "user" ? "text-right" : "text-left"}`}>
                    {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-[#272729] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-[#ffffff]" />
                </div>
                <div className="bg-[#f5f5f7] border border-[#e0e0e0] p-4 rounded-[18px] rounded-tl-[4px]">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-[#0066cc] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick question chips */}
        {messages.length === 1 && (
          <div className="px-6 pb-3 border-t border-[#e0e0e0]">
            <p className="text-xs text-[#7a7a7a] mb-2 mt-3 font-bold uppercase tracking-widest">
              Sugestões
            </p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="text-xs font-bold text-[#1d1d1f] border border-[#e0e0e0] px-4 py-2 rounded-full bg-transparent hover:bg-[#f5f5f7] transition-colors duration-150"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="bg-[#f5f5f7] border-t border-[#e0e0e0] p-4 flex-shrink-0">
          {rateLimitCooldown > 0 && (
            <div className="mb-3 p-3 border border-[#e0e0e0] bg-[#f5f5f7] rounded-[8px]">
              <p className="text-xs text-[#1d1d1f] flex items-center gap-1 font-bold">
                <Info className="h-3 w-3" />
                Aguarde {rateLimitCooldown}s para enviar outra mensagem
              </p>
            </div>
          )}
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                rateLimitCooldown > 0
                  ? `Aguarde ${rateLimitCooldown}s...`
                  : "Faça uma pergunta sobre os datasets..."
              }
              className="flex-1 bg-[#ffffff]"
              disabled={isTyping || rateLimitCooldown > 0}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || rateLimitCooldown > 0}
              size="icon"
            >
              {rateLimitCooldown > 0 ? (
                <span className="text-xs font-black">{rateLimitCooldown}s</span>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-[#7a7a7a] mt-2 flex items-center gap-1 max-w-3xl mx-auto leading-[1.33]">
            <Info className="h-3 w-3" />
            A Alice analisa dados dos datasets para fornecer insights e responder suas perguntas
          </p>
        </div>
      </div>
    </div>
  )
}
