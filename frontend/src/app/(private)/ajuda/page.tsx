"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  HelpCircle, BookOpen, Search, ChevronRight,
  PlayCircle, CheckCircle, Clock, AlertCircle, Lightbulb,
} from "lucide-react"
import { tutorials, faqs } from "@/lib/help-content"

function getLevelStyle(level: string): React.CSSProperties {
  switch (level) {
    case "Básico":
      return { color: "#27a644", background: "rgba(39,166,68,0.08)", border: "1px solid rgba(39,166,68,0.20)", borderRadius: "9999px", padding: "2px 8px", fontSize: "11px", fontWeight: 500 }
    case "Intermediário":
      return { color: "#d97706", background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.20)", borderRadius: "9999px", padding: "2px 8px", fontSize: "11px", fontWeight: 500 }
    case "Avançado":
      return { color: "#c13515", background: "rgba(193,53,21,0.06)", border: "1px solid rgba(193,53,21,0.20)", borderRadius: "9999px", padding: "2px 8px", fontSize: "11px", fontWeight: 500 }
    default:
      return { color: "#6a6a6a", background: "#f7f7f7", border: "1px solid #dddddd", borderRadius: "9999px", padding: "2px 8px", fontSize: "11px", fontWeight: 500 }
  }
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Todos:     <HelpCircle className="h-4 w-4" />,
  Dashboard: <PlayCircle className="h-4 w-4" />,
  Datasets:  <BookOpen className="h-4 w-4" />,
  Alice:     <Lightbulb className="h-4 w-4" />,
}

export default function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null)
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const categories = ["Todos", "Dashboard", "Datasets", "Alice"]

  const filteredTutorials = tutorials.filter(t =>
    (t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === "Todos" || t.category === selectedCategory)
  )

  const filteredFAQs = faqs.filter(f =>
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#ffffff" }}>

      {/* ── Page Header ── */}
      <div style={{ padding: "24px 32px 0" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="mb-1" style={{ color: "#222222", fontSize: "24px", fontWeight: 510, letterSpacing: "-0.288px" }}>
              Central de Ajuda
            </h1>
            <p className="text-sm" style={{ color: "#6a6a6a" }}>
              Tutoriais, documentação e perguntas frequentes do DataDock
            </p>
          </div>

          {/* Search */}
          <div className="relative" style={{ width: 300 }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#929292" }} />
            <Input
              placeholder="Pesquisar na documentação..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
              style={{
                background: "#ffffff",
                border: "1px solid #dddddd",
                borderRadius: "8px",
                color: "#222222",
                height: "36px",
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderBottom: "1px solid #ebebeb", marginBottom: 0 }} />
      </div>

      {/* ── Body: 2-column layout ── */}
      <div className="flex gap-0" style={{ padding: "24px 32px", gap: 24 }}>

        {/* ── Sidebar: categories ── */}
        <aside className="hidden md:flex flex-col flex-shrink-0"
          style={{
            width: 220,
            background: "#f7f7f7",
            border: "1px solid #dddddd",
            borderRadius: "14px",
            padding: "8px",
            height: "fit-content",
            position: "sticky",
            top: "24px",
          }}>
          <p className="text-[11px] uppercase tracking-wider mb-2 px-3 pt-1" style={{ color: "#929292", fontWeight: 510 }}>
            Categorias
          </p>
          {categories.map(cat => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md transition-all duration-150"
                style={isActive
                  ? {
                      background: "rgba(255,56,92,0.06)",
                      color: "#ff385c",
                      borderLeft: "2px solid #ff385c",
                      paddingLeft: "10px",
                      fontWeight: 510,
                      fontSize: "13px",
                    }
                  : {
                      color: "#6a6a6a",
                      fontSize: "13px",
                      fontWeight: 510,
                      borderLeft: "2px solid transparent",
                      paddingLeft: "10px",
                    }
                }
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#f2f2f2"; e.currentTarget.style.color = "#222222" } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6a6a6a" } }}
              >
                <span style={{ color: isActive ? "#ff385c" : "#929292" }}>
                  {CATEGORY_ICONS[cat]}
                </span>
                {cat}
              </button>
            )
          })}

          {/* Quick start box */}
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #ebebeb" }}>
            <p className="text-[11px] uppercase tracking-wider mb-2 px-1" style={{ color: "#929292", fontWeight: 510 }}>
              Início Rápido
            </p>
            <ul className="space-y-1.5 text-xs px-1" style={{ color: "#6a6a6a" }}>
              {[
                "Faça login com suas credenciais",
                "Explore o dashboard",
                "Converse com a Alice",
                "Gerencie seus datasets",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: "#27a644" }} />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── Main content area ── */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* Mobile category pills */}
          <div className="flex gap-2 flex-wrap md:hidden">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="text-xs px-3 py-1.5 rounded-full transition-colors duration-150"
                style={selectedCategory === cat
                  ? { background: "#ff385c", color: "#fff", border: "1px solid #ff385c" }
                  : { background: "#f7f7f7", color: "#6a6a6a", border: "1px solid #dddddd" }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Tutorials section ── */}
          <section>
            <h2 className="flex items-center gap-2 mb-4"
              style={{ color: "#222222", fontSize: "15px", fontWeight: 510 }}>
              <BookOpen className="h-4 w-4" style={{ color: "#ff385c" }} />
              Tutoriais por Módulo
              {filteredTutorials.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full ml-1"
                  style={{ background: "rgba(255,56,92,0.06)", border: "1px solid rgba(255,56,92,0.15)", color: "#ff385c" }}>
                  {filteredTutorials.length}
                </span>
              )}
            </h2>

            <div className="space-y-1">
              {filteredTutorials.map(tutorial => (
                <div key={tutorial.id}
                  className="transition-all duration-150"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #dddddd",
                    borderRadius: "14px",
                    marginBottom: "4px",
                  }}>
                  {/* Accordion trigger */}
                  <button
                    className="w-full flex items-start justify-between gap-4 transition-colors duration-150"
                    style={{ padding: "16px", borderRadius: expandedTutorial === tutorial.id ? "14px 14px 0 0" : "14px" }}
                    onClick={() => setExpandedTutorial(expandedTutorial === tutorial.id ? null : tutorial.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f7f7f7")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div className="flex items-start gap-3 flex-1 text-left">
                      <div className="p-2 rounded-lg flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(255,56,92,0.06)" }}>
                        <tutorial.icon className="h-4 w-4" style={{ color: "#ff385c" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm mb-1" style={{ color: "#222222", fontWeight: 510 }}>
                          {tutorial.title}
                        </p>
                        <p className="text-sm mb-2" style={{ color: "#6a6a6a" }}>
                          {tutorial.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span style={getLevelStyle(tutorial.level)}>{tutorial.level}</span>
                          <span className="flex items-center gap-1"
                            style={{ color: "#929292", background: "#f7f7f7", border: "1px solid #ebebeb", borderRadius: "9999px", padding: "2px 8px", fontSize: "11px" }}>
                            <Clock className="h-3 w-3" />
                            {tutorial.duration}
                          </span>
                          <span style={{ color: "#929292", background: "#f7f7f7", border: "1px solid #ebebeb", borderRadius: "9999px", padding: "2px 8px", fontSize: "11px" }}>
                            {tutorial.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 flex-shrink-0 mt-0.5 transition-transform duration-200 ${expandedTutorial === tutorial.id ? "rotate-90" : ""}`}
                      style={{ color: "#929292" }}
                    />
                  </button>

                  {/* Accordion content */}
                  {expandedTutorial === tutorial.id && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid #ebebeb" }}>
                      <h4 className="text-sm font-medium mt-4 mb-3" style={{ color: "#222222" }}>
                        Passo a passo:
                      </h4>
                      <ol className="space-y-2.5">
                        {tutorial.steps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                              style={{ background: "rgba(255,56,92,0.08)", color: "#ff385c", border: "1px solid rgba(255,56,92,0.20)" }}>
                              {i + 1}
                            </span>
                            <span className="leading-relaxed" style={{ color: "#3f3f3f" }}>{step}</span>
                          </li>
                        ))}
                      </ol>
                      {tutorial.tips && (
                        <div className="mt-4 p-3 rounded-lg"
                          style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: "#d97706" }}>
                            <Lightbulb className="h-4 w-4" />
                            Dicas úteis:
                          </h5>
                          <ul className="text-sm space-y-1.5" style={{ color: "#3f3f3f" }}>
                            {tutorial.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span style={{ color: "#d97706", flexShrink: 0 }}>•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {filteredTutorials.length === 0 && (
                <div className="text-center py-12 rounded-xl"
                  style={{ background: "#f7f7f7", border: "1px solid #ebebeb" }}>
                  <Search className="h-8 w-8 mx-auto mb-3" style={{ color: "#929292" }} />
                  <p className="text-sm" style={{ color: "#6a6a6a" }}>
                    Nenhum tutorial encontrado para &ldquo;{searchTerm}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── FAQ section ── */}
          <section>
            <h2 className="flex items-center gap-2 mb-4"
              style={{ color: "#222222", fontSize: "15px", fontWeight: 510 }}>
              <AlertCircle className="h-4 w-4" style={{ color: "#ff385c" }} />
              Perguntas Frequentes
              {filteredFAQs.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full ml-1"
                  style={{ background: "rgba(255,56,92,0.06)", border: "1px solid rgba(255,56,92,0.15)", color: "#ff385c" }}>
                  {filteredFAQs.length}
                </span>
              )}
            </h2>

            <div className="grid md:grid-cols-2 gap-1">
              {filteredFAQs.map((faq, index) => (
                <div key={index}
                  className="transition-all duration-150"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #dddddd",
                    borderRadius: "14px",
                  }}>
                  <button
                    className="w-full text-left transition-colors duration-150"
                    style={{ padding: "16px", borderRadius: "14px" }}
                    onClick={() => setExpandedFAQ(expandedFAQ === `faq-${index}` ? null : `faq-${index}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f7f7f7")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div className="flex items-start gap-2">
                      <ChevronRight
                        className={`h-4 w-4 mt-0.5 flex-shrink-0 transition-transform duration-200 ${expandedFAQ === `faq-${index}` ? "rotate-90" : ""}`}
                        style={{ color: "#929292" }}
                      />
                      <span className="text-sm font-medium" style={{ color: "#222222", fontWeight: 510 }}>
                        {faq.question}
                      </span>
                    </div>
                  </button>

                  {expandedFAQ === `faq-${index}` && (
                    <div className="px-4 pb-4 ml-6"
                      style={{ borderTop: "1px solid #ebebeb", paddingTop: "12px", marginTop: "-1px" }}>
                      <p className="text-sm leading-relaxed" style={{ color: "#6a6a6a", lineHeight: "1.7" }}>
                        {faq.answer}
                      </p>
                      <span className="inline-block mt-3 text-[11px] px-2 py-0.5 rounded-full"
                        style={{ color: "#929292", background: "#f7f7f7", border: "1px solid #ebebeb" }}>
                        {faq.category}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-12 rounded-xl"
                style={{ background: "#f7f7f7", border: "1px solid #ebebeb" }}>
                <Search className="h-8 w-8 mx-auto mb-3" style={{ color: "#929292" }} />
                <p className="text-sm" style={{ color: "#6a6a6a" }}>Nenhuma pergunta encontrada.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
