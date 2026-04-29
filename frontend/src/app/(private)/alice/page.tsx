"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bot, Send, User, Sparkles, Info, ChevronDown, ChevronRight,
  Database, Search, Table, BarChart2, Code2, Layers, Brain, Plus,
  MessageSquare, Zap, TrendingUp, FileSearch,
} from "lucide-react"
import {
  askAliceAgent, TOOL_LABELS, SUGGESTED_QUESTIONS,
  type AgentStep, type AgentChart,
} from "@/lib/alice-agent"
import { getAccessToken } from "@/lib/auth"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  steps?: AgentStep[]
  charts?: AgentChart[]
  timestamp: Date
  isLoading?: boolean
  isAgent?: boolean
}

function renderMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let key = 0
  for (const line of lines) {
    if (line.startsWith("### "))
      elements.push(<h3 key={key++} className="font-semibold text-sm mt-3 mb-1" style={{ color: "#222222" }}>{line.slice(4)}</h3>)
    else if (line.startsWith("## "))
      elements.push(<h2 key={key++} className="font-semibold text-base mt-3 mb-1" style={{ color: "#222222" }}>{line.slice(3)}</h2>)
    else if (line.startsWith("# "))
      elements.push(<h1 key={key++} className="font-semibold text-lg mt-3 mb-1" style={{ color: "#222222" }}>{line.slice(2)}</h1>)
    else if (line.startsWith("- ") || line.startsWith("* "))
      elements.push(<li key={key++} className="ml-4 list-disc text-sm leading-relaxed" style={{ color: "#3f3f3f" }}>{renderInline(line.slice(2))}</li>)
    else if (line.match(/^\d+\. /))
      elements.push(<li key={key++} className="ml-4 list-decimal text-sm leading-relaxed" style={{ color: "#3f3f3f" }}>{renderInline(line.replace(/^\d+\. /, ""))}</li>)
    else if (line.startsWith("```")) { /* skip fence markers */ }
    else if (line.trim() === "") elements.push(<br key={key++} />)
    else elements.push(<p key={key++} className="text-sm leading-relaxed" style={{ color: "#3f3f3f" }}>{renderInline(line)}</p>)
  }
  return elements
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold" style={{ color: "#222222" }}>{part.slice(2, -2)}</strong>
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="px-1.5 py-0.5 rounded font-mono text-xs"
          style={{ background: "#f2f2f2", color: "#3f3f3f", border: "1px solid #ebebeb" }}>
          {part.slice(1, -1)}
        </code>
      )
    return part
  })
}

function toolIcon(tool: string) {
  const cls = "h-3 w-3"
  switch (tool) {
    case "execute_sql":          return <Code2 className={cls} />
    case "list_datasets":        return <Layers className={cls} />
    case "search_datasets":      return <Search className={cls} />
    case "get_table_schema":     return <Table className={cls} />
    case "get_data_sample":      return <Database className={cls} />
    case "get_column_statistics":return <BarChart2 className={cls} />
    default:                     return <Brain className={cls} />
  }
}

function StepCard({ step, index }: { step: AgentStep; index: number }) {
  const [open, setOpen] = useState(false)
  const isSql = step.tool === "execute_sql"
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #dddddd" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors duration-150"
        style={{ background: "#f7f7f7" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f2f2f2")}
        onMouseLeave={e => (e.currentTarget.style.background = "#f7f7f7")}
      >
        {open
          ? <ChevronDown className="h-3 w-3 flex-shrink-0" style={{ color: "#929292" }} />
          : <ChevronRight className="h-3 w-3 flex-shrink-0" style={{ color: "#929292" }} />}
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#6a6a6a" }}>
          {toolIcon(step.tool)}
          {TOOL_LABELS[step.tool] || step.tool}
        </span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md"
          style={{ background: "rgba(255,56,92,0.06)", border: "1px solid rgba(255,56,92,0.15)", color: "#ff385c" }}>
          passo {index + 1}
        </span>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid #ebebeb" }}>
          <div className="px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider mb-1.5 font-medium" style={{ color: "#929292" }}>Input</p>
            {isSql ? (
              <pre className="p-2.5 rounded-md text-[11px] overflow-x-auto whitespace-pre-wrap font-mono"
                style={{ background: "#f7f7f7", color: "#27a644", border: "1px solid #ebebeb" }}>
                {step.input}
              </pre>
            ) : (
              <p className="font-mono text-xs" style={{ color: "#3f3f3f" }}>{step.input}</p>
            )}
          </div>
          <div className="px-3 py-2.5" style={{ borderTop: "1px solid #ebebeb" }}>
            <p className="text-[10px] uppercase tracking-wider mb-1.5 font-medium" style={{ color: "#929292" }}>Resultado</p>
            <pre className="whitespace-pre-wrap font-mono text-[11px] max-h-40 overflow-y-auto" style={{ color: "#3f3f3f" }}>
              {step.output}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

const SUGGESTION_ICONS = [
  <TrendingUp key="trend" className="h-4 w-4 flex-shrink-0" style={{ color: "#ff385c" }} />,
  <FileSearch key="search" className="h-4 w-4 flex-shrink-0" style={{ color: "#ff385c" }} />,
  <BarChart2 key="chart" className="h-4 w-4 flex-shrink-0" style={{ color: "#ff385c" }} />,
  <Database key="db" className="h-4 w-4 flex-shrink-0" style={{ color: "#ff385c" }} />,
]

export default function AlicePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [useAgent, setUseAgent] = useState(true)
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem("alice_session_id")
    if (stored) setSessionId(stored)
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (rateLimitCooldown <= 0) return
    const t = setTimeout(() => setRateLimitCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [rateLimitCooldown])

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = "24px"
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
  }

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
    if (textareaRef.current) textareaRef.current.style.height = "24px"
    setIsSending(true)

    try {
      if (useAgent) {
        const result = await askAliceAgent(text, sessionId)
        setSessionId(result.session_id)
        localStorage.setItem("alice_session_id", result.session_id)
        setMessages(prev =>
          prev.map(m =>
            m.isLoading
              ? { ...m, isLoading: false, content: result.response, steps: result.steps, charts: result.charts }
              : m
          )
        )
      } else {
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
      if (msg.includes("429") || msg.toLowerCase().includes("limite")) setRateLimitCooldown(60)
      setMessages(prev =>
        prev.map(m => m.isLoading ? { ...m, isLoading: false, content: `Erro: ${msg}` } : m)
      )
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }, [input, isSending, rateLimitCooldown, sessionId, useAgent])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewConversation = () => {
    setSessionId(null)
    localStorage.removeItem("alice_session_id")
    setMessages([])
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem)", background: "#ffffff" }}>

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid #ebebeb",
        }}>
        {/* Left: icon + title + badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-[10px]"
            style={{
              width: 40, height: 40,
              background: "rgba(255,56,92,0.06)",
              border: "1px solid rgba(255,56,92,0.15)",
            }}>
            <Sparkles className="h-5 w-5" style={{ color: "#ff385c" }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl" style={{ color: "#222222", fontWeight: 590, letterSpacing: "-0.288px" }}>
              Alice
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(255,56,92,0.06)",
                border: "1px solid rgba(255,56,92,0.15)",
                color: "#ff385c",
                fontWeight: 510,
              }}>
              IA
            </span>
          </div>
        </div>

        {/* Right: mode toggle + status + new conversation */}
        <div className="flex items-center gap-3">
          {/* Mode toggle */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-xs" style={{ color: "#929292" }}>Modo:</span>
            {([["Agente SQL", true], ["Chat RAG", false]] as const).map(([label, isAgentMode]) => (
              <button
                key={label}
                onClick={() => setUseAgent(isAgentMode)}
                className="text-xs px-2.5 py-1 transition-colors duration-150"
                style={useAgent === isAgentMode
                  ? { background: "#ff385c", color: "#fff", borderRadius: "8px", border: "1px solid #ff385c", fontWeight: 510 }
                  : { background: "#f7f7f7", color: "#6a6a6a", borderRadius: "8px", border: "1px solid #dddddd" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Online status */}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full"
              style={{ background: "#27a644", boxShadow: "0 0 0 3px rgba(39,166,68,0.15)", animation: "pulse 2s infinite" }} />
            <span className="text-xs" style={{ color: "#6a6a6a" }}>Online</span>
          </div>

          {/* New conversation button */}
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors duration-150"
            style={{
              color: "#6a6a6a",
              background: "#f7f7f7",
              border: "1px solid #dddddd",
              borderRadius: "8px",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "#222222"
              e.currentTarget.style.background = "#f2f2f2"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "#6a6a6a"
              e.currentTarget.style.background = "#f7f7f7"
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Nova conversa
          </button>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isEmpty ? (
          /* ── Empty state ── */
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
            {/* Central icon */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex items-center justify-center rounded-2xl"
                style={{
                  width: 72, height: 72,
                  background: "rgba(255,56,92,0.06)",
                  border: "1px solid rgba(255,56,92,0.15)",
                }}>
                <Bot className="h-9 w-9" style={{ color: "#ff385c" }} />
              </div>
              <div>
                <h2 className="text-[22px] mb-1.5"
                  style={{ color: "#222222", fontWeight: 510, letterSpacing: "-0.288px" }}>
                  Olá! Eu sou a Alice
                </h2>
                <p className="text-sm max-w-sm" style={{ color: "#6a6a6a" }}>
                  {useAgent
                    ? "Sua assistente de IA para análise de dados — posso executar queries reais nos seus dados."
                    : "Sua assistente de IA para análise de dados com base nos metadados dos datasets."}
                </p>
              </div>
            </div>

            {/* Suggestions grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(q)
                    textareaRef.current?.focus()
                  }}
                  className="flex items-start gap-3 text-left px-4 py-3 rounded-lg transition-all duration-150 group"
                  style={{
                    background: "#f7f7f7",
                    border: "1px solid #dddddd",
                    borderRadius: "14px",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#f2f2f2"
                    e.currentTarget.style.borderColor = "rgba(255,56,92,0.25)"
                    e.currentTarget.style.boxShadow = "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "#f7f7f7"
                    e.currentTarget.style.borderColor = "#dddddd"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <span className="mt-0.5 flex-shrink-0">
                    {SUGGESTION_ICONS[i % SUGGESTION_ICONS.length]}
                  </span>
                  <span className="text-[13px] leading-snug" style={{ color: "#3f3f3f", fontWeight: 510 }}>
                    {q}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Chat messages ── */
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="space-y-6 py-6 px-8 max-w-4xl mx-auto w-full">
              {messages.map(msg => (
                <div key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                  {/* Avatar */}
                  {msg.role === "user" ? (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center"
                      style={{ background: "#f2f2f2", border: "1px solid #dddddd" }}>
                      <User className="h-4 w-4" style={{ color: "#6a6a6a" }} />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mt-5"
                      style={{ background: "rgba(255,56,92,0.08)", border: "1px solid rgba(255,56,92,0.2)" }}>
                      <Bot className="h-3.5 w-3.5" style={{ color: "#ff385c" }} />
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end max-w-[70%]" : "items-start max-w-[75%]"}`}>
                    {/* Alice label */}
                    {msg.role === "assistant" && (
                      <span className="text-xs ml-0.5" style={{ color: "#929292", fontWeight: 510 }}>Alice</span>
                    )}

                    {/* Bubble */}
                    <div className="px-3.5 py-2.5"
                      style={msg.role === "user"
                        ? {
                            background: "#ff385c",
                            border: "1px solid #ff385c",
                            borderRadius: "12px 12px 2px 12px",
                            color: "#ffffff",
                          }
                        : {
                            background: "#f7f7f7",
                            border: "1px solid #ebebeb",
                            borderRadius: "2px 12px 12px 12px",
                          }
                      }>
                      {msg.isLoading ? (
                        /* Typing indicator */
                        <div className="flex gap-1.5 py-0.5">
                          {[0, 150, 300].map(delay => (
                            <div key={delay} className="w-2 h-2 rounded-full"
                              style={{
                                background: "#929292",
                                animation: `bounce 1.2s ease-in-out ${delay}ms infinite`,
                              }} />
                          ))}
                        </div>
                      ) : msg.role === "user" ? (
                        <p className="text-sm" style={{ color: "#ffffff" }}>{msg.content}</p>
                      ) : (
                        <div className="space-y-1">
                          {renderMarkdown(msg.content)}
                        </div>
                      )}
                    </div>

                    {/* Agent steps */}
                    {msg.steps && msg.steps.length > 0 && (
                      <div className="w-full space-y-1 mt-1">
                        <p className="text-[10px] flex items-center gap-1 ml-0.5" style={{ color: "#929292" }}>
                          <Brain className="h-3 w-3" />
                          Raciocínio do agente ({msg.steps.length} passos)
                        </p>
                        {msg.steps.map((step, i) => <StepCard key={i} step={step} index={i} />)}
                      </div>
                    )}

                    {/* Charts */}
                    {msg.charts && msg.charts.length > 0 && (
                      <div className="w-full space-y-2 mt-1">
                        {msg.charts.map((chart, i) => (
                          <div key={i} className="rounded-lg overflow-hidden"
                            style={{ border: "1px solid #dddddd", background: "#ffffff" }}>
                            <div className="px-3 py-2 text-xs flex items-center gap-1.5"
                              style={{ background: "#f7f7f7", borderBottom: "1px solid #ebebeb", color: "#6a6a6a" }}>
                              <BarChart2 className="h-3 w-3" />
                              {chart.title}
                            </div>
                            <img src={`data:image/png;base64,${chart.image}`} alt={chart.title} className="w-full" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-[11px] px-0.5" style={{ color: "#929292" }}>
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {msg.isAgent && !msg.isLoading && (
                        <span className="ml-2" style={{ color: "#ff385c" }}>• Agente SQL</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* ── Input area (footer) ── */}
        <div className="flex-shrink-0"
          style={{
            padding: "16px 32px 24px",
            borderTop: "1px solid #ebebeb",
          }}>
          {/* Rate limit warning */}
          {rateLimitCooldown > 0 && (
            <div className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Info className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#d97706" }} />
              <p className="text-xs" style={{ color: "#d97706" }}>
                Aguarde {rateLimitCooldown}s antes de enviar outra mensagem
              </p>
            </div>
          )}

          {/* Input container */}
          <div className="flex items-end gap-3 rounded-[10px] px-3.5 py-3 transition-all duration-150"
            style={{
              background: "#ffffff",
              border: "1px solid #dddddd",
            }}
            onFocusCapture={e => {
              const el = e.currentTarget
              el.style.borderColor = "#222222"
              el.style.borderWidth = "2px"
            }}
            onBlurCapture={e => {
              const el = e.currentTarget
              el.style.borderColor = "#dddddd"
              el.style.borderWidth = "1px"
            }}>
            <div className="flex-1 flex items-center">
              <MessageSquare className="h-4 w-4 flex-shrink-0 mr-2" style={{ color: "#929292" }} />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder={
                  rateLimitCooldown > 0
                    ? `Aguarde ${rateLimitCooldown}s...`
                    : useAgent
                    ? "Ex: Qual a média dos valores na tabela vendas?"
                    : "Faça uma pergunta sobre os datasets..."
                }
                disabled={isSending || rateLimitCooldown > 0}
                rows={1}
                className="w-full resize-none bg-transparent border-none outline-none text-sm"
                style={{
                  color: "#222222",
                  minHeight: "24px",
                  maxHeight: "120px",
                  lineHeight: "1.5",
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending || rateLimitCooldown > 0}
              className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-150"
              style={{
                width: 36,
                height: 36,
                background: !input.trim() || isSending || rateLimitCooldown > 0
                  ? "#ffd1da"
                  : "#ff385c",
                opacity: !input.trim() || rateLimitCooldown > 0 ? 0.5 : 1,
                border: "none",
                cursor: !input.trim() || isSending || rateLimitCooldown > 0 ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => {
                const disabled = !input.trim() || isSending || rateLimitCooldown > 0
                if (!disabled) e.currentTarget.style.background = "#e00b41"
              }}
              onMouseLeave={e => {
                const disabled = !input.trim() || isSending || rateLimitCooldown > 0
                if (!disabled) e.currentTarget.style.background = "#ff385c"
              }}
            >
              {rateLimitCooldown > 0 ? (
                <span className="text-[10px] font-mono text-white">{rateLimitCooldown}s</span>
              ) : isSending ? (
                <div className="h-4 w-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              ) : (
                <Send className="h-4 w-4 text-white" />
              )}
            </button>
          </div>

          {/* Hint text */}
          <p className="text-[11px] mt-2 flex items-center gap-1 ml-0.5" style={{ color: "#929292" }}>
            <Zap className="h-3 w-3" />
            {useAgent
              ? "Enter para enviar · Shift+Enter para nova linha · Apenas consultas SELECT são permitidas."
              : "Enter para enviar · Shift+Enter para nova linha · Respostas baseadas nos metadados dos datasets."}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        textarea::placeholder { color: #929292; }
        textarea:disabled { opacity: 0.5; cursor: not-allowed; }
        /* Custom thin scrollbar */
        .flex-1::-webkit-scrollbar { width: 4px; }
        .flex-1::-webkit-scrollbar-track { background: transparent; }
        .flex-1::-webkit-scrollbar-thumb { background: #dddddd; border-radius: 2px; }
      `}</style>
    </div>
  )
}
