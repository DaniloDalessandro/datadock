"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Send,
  User,
  Sparkles,
  Info,
  ChevronDown,
  ChevronRight,
  Database,
  Search,
  Table,
  BarChart2,
  Code2,
  Layers,
  Brain,
} from "lucide-react"
import {
  askAliceAgent,
  TOOL_LABELS,
  SUGGESTED_QUESTIONS,
  type AgentStep,
} from "@/lib/alice-agent"
import { getAccessToken } from "@/lib/auth"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  steps?: AgentStep[]
  timestamp: Date
  isLoading?: boolean
  isAgent?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} className="font-bold text-base mt-3 mb-1">{line.slice(4)}</h3>)
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="font-bold text-lg mt-3 mb-1">{line.slice(3)}</h2>)
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={key++} className="font-bold text-xl mt-3 mb-1">{line.slice(2)}</h1>)
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={key++} className="ml-4 list-disc">
          {renderInline(line.slice(2))}
        </li>
      )
    } else if (line.match(/^\d+\. /)) {
      elements.push(
        <li key={key++} className="ml-4 list-decimal">
          {renderInline(line.replace(/^\d+\. /, ""))}
        </li>
      )
    } else if (line.startsWith("```")) {
      // skip fence lines
    } else if (line.trim() === "") {
      elements.push(<br key={key++} />)
    } else {
      elements.push(<p key={key++} className="leading-relaxed">{renderInline(line)}</p>)
    }
  }

  return elements
}

function renderInline(text: string): React.ReactNode {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-gray-200 text-gray-800 px-1 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

function toolIcon(tool: string) {
  switch (tool) {
    case "execute_sql": return <Code2 className="h-3 w-3" />
    case "list_datasets": return <Layers className="h-3 w-3" />
    case "search_datasets": return <Search className="h-3 w-3" />
    case "get_table_schema": return <Table className="h-3 w-3" />
    case "get_data_sample": return <Database className="h-3 w-3" />
    case "get_column_statistics": return <BarChart2 className="h-3 w-3" />
    default: return <Brain className="h-3 w-3" />
  }
}

// ─── Step viewer ─────────────────────────────────────────────────────────────

function StepCard({ step, index }: { step: AgentStep; index: number }) {
  const [open, setOpen] = useState(false)
  const isSql = step.tool === "execute_sql"

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        {open ? <ChevronDown className="h-3 w-3 flex-shrink-0" /> : <ChevronRight className="h-3 w-3 flex-shrink-0" />}
        <span className="flex items-center gap-1 text-gray-600">
          {toolIcon(step.tool)}
          {TOOL_LABELS[step.tool] || step.tool}
        </span>
        <Badge variant="outline" className="ml-auto text-[10px] py-0 h-4">
          passo {index + 1}
        </Badge>
      </button>

      {open && (
        <div className="divide-y divide-gray-100">
          <div className="px-3 py-2 bg-white">
            <p className="text-[10px] uppercase text-gray-400 mb-1 font-medium">Input</p>
            {isSql ? (
              <pre className="bg-gray-900 text-green-300 p-2 rounded text-[11px] overflow-x-auto whitespace-pre-wrap">
                {step.input}
              </pre>
            ) : (
              <p className="text-gray-700 font-mono">{step.input}</p>
            )}
          </div>
          <div className="px-3 py-2 bg-white">
            <p className="text-[10px] uppercase text-gray-400 mb-1 font-medium">Resultado</p>
            <pre className="text-gray-700 whitespace-pre-wrap font-mono text-[11px] max-h-40 overflow-y-auto">
              {step.output}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AlicePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [useAgent, setUseAgent] = useState(true)
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("alice_session_id")
    if (stored) setSessionId(stored)
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Rate limit countdown
  useEffect(() => {
    if (rateLimitCooldown <= 0) return
    const t = setTimeout(() => setRateLimitCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [rateLimitCooldown])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isSending || rateLimitCooldown > 0) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }
    const loadingMsg: Message = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
      isAgent: useAgent,
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput("")
    setIsSending(true)

    try {
      if (useAgent) {
        const result = await askAliceAgent(text, sessionId)
        const newSession = result.session_id
        setSessionId(newSession)
        localStorage.setItem("alice_session_id", newSession)

        setMessages(prev =>
          prev.map(m =>
            m.isLoading
              ? {
                  ...m,
                  isLoading: false,
                  content: result.response,
                  steps: result.steps,
                }
              : m
          )
        )
      } else {
        // Fallback to old chat endpoint
        const token = getAccessToken()
        const res = await fetch("/api/alice/chat/", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: text }),
        })
        const data = await res.json()
        setMessages(prev =>
          prev.map(m =>
            m.isLoading ? { ...m, isLoading: false, content: data.response || data.error } : m
          )
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido"
      if (msg.includes("429") || msg.toLowerCase().includes("limite")) {
        setRateLimitCooldown(60)
      }
      setMessages(prev =>
        prev.map(m =>
          m.isLoading ? { ...m, isLoading: false, content: `Erro: ${msg}` } : m
        )
      )
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }, [input, isSending, rateLimitCooldown, sessionId, useAgent])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] p-4 gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Alice
              <Sparkles className="h-4 w-4 text-purple-500" />
            </h1>
            <p className="text-xs text-gray-500">
              {useAgent ? "Agente inteligente com acesso direto aos dados" : "Assistente com contexto de metadados"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Modo:</span>
          <Button
            variant={useAgent ? "default" : "outline"}
            size="sm"
            onClick={() => setUseAgent(true)}
            className="text-xs h-7"
          >
            Agente SQL
          </Button>
          <Button
            variant={!useAgent ? "default" : "outline"}
            size="sm"
            onClick={() => setUseAgent(false)}
            className="text-xs h-7"
          >
            Chat RAG
          </Button>
          {sessionId && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-gray-400"
              onClick={() => {
                setSessionId(null)
                localStorage.removeItem("alice_session_id")
                setMessages([])
              }}
            >
              Nova conversa
            </Button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-sm">
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">

          {/* Empty state */}
          {isEmpty && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
              <div className="text-center">
                <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Brain className="h-8 w-8 text-purple-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Alice está pronta</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  {useAgent
                    ? "No modo Agente SQL, posso executar queries reais nos seus dados e responder com precisão."
                    : "No modo Chat RAG, respondo com base nos metadados dos datasets."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-gray-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {!isEmpty && (
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-5 max-w-4xl mx-auto">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className={`h-8 w-8 flex-shrink-0 ${
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-purple-500 to-blue-600"
                        : "bg-gradient-to-br from-gray-600 to-gray-800"
                    }`}>
                      <AvatarFallback className="text-white">
                        {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`flex-1 max-w-[85%] space-y-2 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>

                      {/* Bubble */}
                      <div className={`rounded-2xl px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-gray-100 text-gray-900 rounded-tl-sm"
                      }`}>
                        {msg.isLoading ? (
                          <div className="flex gap-1 py-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        ) : msg.role === "user" ? (
                          msg.content
                        ) : (
                          <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                        )}
                      </div>

                      {/* Steps (tool calls) */}
                      {msg.steps && msg.steps.length > 0 && (
                        <div className="w-full space-y-1">
                          <p className="text-[10px] text-gray-400 flex items-center gap-1 ml-1">
                            <Brain className="h-3 w-3" />
                            Raciocínio do agente ({msg.steps.length} passos)
                          </p>
                          {msg.steps.map((step, i) => (
                            <StepCard key={i} step={step} index={i} />
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <span className="text-[10px] text-gray-400 px-1">
                        {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {msg.isAgent && !msg.isLoading && (
                          <span className="ml-2 text-purple-400">• Agente SQL</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Input bar */}
          <div className="border-t bg-gray-50 p-3">
            {rateLimitCooldown > 0 && (
              <div className="mb-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Aguarde {rateLimitCooldown}s antes de enviar outra mensagem
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  rateLimitCooldown > 0
                    ? `Aguarde ${rateLimitCooldown}s...`
                    : useAgent
                    ? "Ex: Qual a média dos valores na tabela vendas?"
                    : "Faça uma pergunta sobre os datasets..."
                }
                disabled={isSending || rateLimitCooldown > 0}
                className="flex-1 bg-white text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isSending || rateLimitCooldown > 0}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 px-4"
              >
                {rateLimitCooldown > 0 ? (
                  <span className="text-xs font-mono">{rateLimitCooldown}s</span>
                ) : isSending ? (
                  <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1 ml-1">
              <Info className="h-3 w-3" />
              {useAgent
                ? "O agente executa SQL real nos seus dados. Apenas consultas SELECT são permitidas."
                : "Modo RAG: respostas baseadas nos metadados dos datasets."}
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
