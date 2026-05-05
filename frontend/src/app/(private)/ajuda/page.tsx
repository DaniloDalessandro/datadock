"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  ChevronRight,
  CheckCircle,
  Clock,
  Lightbulb,
} from "lucide-react"
import { tutorials, faqs } from "@/lib/help-content"

export default function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null)
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const categories = ["Todos", "Dashboard", "Datasets", "Alice"]

  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesSearch =
      tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "Todos" || tutorial.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getLevelVariant = (level: string): "success" | "warning" | "destructive" | "secondary" => {
    switch (level) {
      case "Básico": return "success"
      case "Intermediário": return "warning"
      case "Avançado": return "destructive"
      default: return "secondary"
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header — parchment sub-nav */}
      <section className="bg-[#f5f5f7] px-8 py-8 border-b border-[#e0e0e0]">
        <h1 className="text-[34px] font-semibold text-[#1d1d1f] leading-[1.47] mb-1 tracking-[-0.374px]">
          Central de Ajuda
        </h1>
        <p className="text-[#7a7a7a] text-[17px] leading-[1.47] tracking-[-0.374px] max-w-xl mb-6">
          Tutoriais, perguntas frequentes e suporte para o DataDock
        </p>

        {/* Search + category filter */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7a7a]" />
            <Input
              variant="search"
              placeholder="Buscar tutoriais, FAQ ou tópicos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-[14px] tracking-[-0.224px] px-[15px] py-[8px] rounded-[8px] transition-colors duration-150 ${
                  selectedCategory === category
                    ? "bg-[#0066cc] text-[#ffffff] font-semibold"
                    : "bg-[#ffffff] text-[#1d1d1f] border border-[#e0e0e0] hover:border-[#0066cc] hover:text-[#0066cc]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content section */}
      <section className="bg-[#ffffff] p-8 space-y-10">
        {/* Quick start guide */}
        <div>
          <h2 className="text-[24px] font-bold text-[#1d1d1f] leading-[1.25] mb-6 tracking-[-0.02em]">
            Guia de Início Rápido
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Card 1 — dark tile */}
            <div className="bg-[#272729] rounded-[18px] p-8">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-[#2997ff]" />
                <h4 className="font-semibold text-[#ffffff] text-[17px] tracking-[-0.374px]">Primeiros Passos</h4>
              </div>
              <ul className="text-[17px] tracking-[-0.374px] leading-[1.47] text-[#cccccc] space-y-3">
                {[
                  "Faça login com suas credenciais fornecidas",
                  "Explore o dashboard para visão geral do sistema",
                  "Converse com a Alice para análise de dados",
                  "Navegue pelo módulo de Datasets para gerenciar dados",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#2997ff] mt-0.5">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Card 2 — parchment */}
            <div className="bg-[#f5f5f7] border border-[#e0e0e0] rounded-[18px] p-8">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-[#0066cc]" />
                <h4 className="font-semibold text-[#1d1d1f] text-[17px] tracking-[-0.374px]">Dicas Importantes</h4>
              </div>
              <ul className="text-[17px] tracking-[-0.374px] leading-[1.47] text-[#7a7a7a] space-y-3">
                {[
                  "Dados são salvos automaticamente",
                  "Use filtros para encontrar informações rapidamente",
                  "Mantenha sempre os dados atualizados",
                  "Entre em contato com suporte quando necessário",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#0066cc] mt-0.5">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Tutorials */}
        <div>
          <h2 className="text-[24px] font-bold text-[#1d1d1f] leading-[1.25] mb-6 tracking-[-0.02em]">
            Tutoriais por Módulo
          </h2>

          {filteredTutorials.length === 0 ? (
            <div className="border border-[#e0e0e0] rounded-[18px] p-8 text-center">
              <Search className="h-10 w-10 text-[#7a7a7a] mx-auto mb-4" />
              <p className="text-[#7a7a7a]">Nenhum tutorial encontrado para sua pesquisa.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  className={`border rounded-[18px] transition-colors duration-200 ${
                    expandedTutorial === tutorial.id
                      ? "border-[#000000]"
                      : "border-[#e0e0e0] hover:border-[#000000]/30"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 bg-[#f5f5f7] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <tutorial.icon className="h-4 w-4 text-[#1d1d1f]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#1d1d1f] mb-1">{tutorial.title}</h3>
                          <p className="text-sm text-[#7a7a7a] mb-3 leading-[1.43]">{tutorial.description}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={getLevelVariant(tutorial.level)}>{tutorial.level}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {tutorial.duration}
                            </Badge>
                            <Badge variant="secondary">{tutorial.category}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setExpandedTutorial(expandedTutorial === tutorial.id ? null : tutorial.id)
                        }
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedTutorial === tutorial.id ? "rotate-90" : ""
                          }`}
                        />
                      </Button>
                    </div>

                    {expandedTutorial === tutorial.id && (
                      <div className="mt-6 pt-6 border-t border-[#e0e0e0]">
                        <h4 className="font-bold text-[#1d1d1f] mb-4 text-xs uppercase tracking-widest">
                          Passo a passo
                        </h4>
                        <ol className="space-y-3">
                          {tutorial.steps.map((step, index) => (
                            <li key={index} className="flex gap-3 text-sm">
                              <span className="flex-shrink-0 w-6 h-6 bg-[#0066cc] text-[#ffffff] rounded-full flex items-center justify-center text-xs font-semibold">
                                {index + 1}
                              </span>
                              <span className="text-[#7a7a7a] pt-0.5 leading-[1.43]">{step}</span>
                            </li>
                          ))}
                        </ol>

                        {tutorial.tips && (
                          <div className="mt-6 p-4 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[18px]">
                            <h5 className="font-semibold text-[14px] text-[#1d1d1f] mb-2 flex items-center gap-2 tracking-[-0.224px]">
                              <Lightbulb className="h-4 w-4 text-[#0066cc]" />
                              Dicas úteis
                            </h5>
                            <ul className="text-[14px] text-[#7a7a7a] space-y-1 tracking-[-0.224px]">
                              {tutorial.tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-[#0066cc] mt-0.5">—</span>
                                  <span className="leading-[1.43]">{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAQ section */}
        <div>
          <h2 className="text-[24px] font-bold text-[#1d1d1f] leading-[1.25] mb-6 tracking-[-0.02em]">
            Perguntas Frequentes
          </h2>

          {filteredFAQs.length === 0 ? (
            <div className="border border-[#e0e0e0] rounded-[18px] p-8 text-center">
              <Search className="h-10 w-10 text-[#7a7a7a] mx-auto mb-4" />
              <p className="text-[#7a7a7a]">Nenhuma pergunta encontrada para sua pesquisa.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className={`border rounded-[18px] transition-colors duration-150 ${
                    expandedFAQ === `faq-${index}`
                      ? "border-[#000000] bg-[#f5f5f7]"
                      : "border-[#e0e0e0] bg-[#ffffff] hover:border-[#000000]/30"
                  }`}
                >
                  <button
                    className="w-full text-left p-5"
                    onClick={() =>
                      setExpandedFAQ(expandedFAQ === `faq-${index}` ? null : `faq-${index}`)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <ChevronRight
                        className={`h-4 w-4 mt-0.5 flex-shrink-0 transition-transform text-[#1d1d1f] ${
                          expandedFAQ === `faq-${index}` ? "rotate-90" : ""
                        }`}
                      />
                      <span className="text-sm font-bold text-[#1d1d1f]">{faq.question}</span>
                    </div>
                  </button>

                  {expandedFAQ === `faq-${index}` && (
                    <div className="px-5 pb-5 ml-7">
                      <p className="text-sm text-[#7a7a7a] mb-3 leading-[1.43]">{faq.answer}</p>
                      <Badge variant="secondary" className="text-xs">
                        {faq.category}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
