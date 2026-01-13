"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  HelpCircle,
  BookOpen,
  Search,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Lightbulb
} from "lucide-react"
import { tutorials, faqs } from "@/lib/help-content"

export default function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null)
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const categories = ["Todos", "Dashboard", "Datasets", "Alice"]

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "Todos" || tutorial.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Básico': return 'bg-green-100 text-green-800'
      case 'Intermediário': return 'bg-yellow-100 text-yellow-800'  
      case 'Avançado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Central de Ajuda</h1>
          <p className="text-sm text-gray-600">Tutoriais, FAQ e suporte para o DataPort</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar tutoriais, FAQ ou tópicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-green-600" />
            Guia de Início Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Primeiros Passos
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-6">
                <li>• Faça login com suas credenciais fornecidas</li>
                <li>• Explore o dashboard para visão geral do sistema</li>
                <li>• Converse com a Alice para análise de dados</li>
                <li>• Navegue pelo módulo de Datasets para gerenciar dados</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Dicas Importantes
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-6">
                <li>• Dados são salvos automaticamente</li>
                <li>• Use filtros para encontrar informações rapidamente</li>
                <li>• Mantenha sempre os dados atualizados</li>
                <li>• Entre em contato com suporte quando necessário</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Tutoriais por Módulo
        </h2>

        {filteredTutorials.map((tutorial) => (
          <Card key={tutorial.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <tutorial.icon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{tutorial.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{tutorial.description}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getLevelColor(tutorial.level)}>
                        {tutorial.level}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {tutorial.duration}
                      </Badge>
                      <Badge variant="outline">{tutorial.category}</Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedTutorial(
                    expandedTutorial === tutorial.id ? null : tutorial.id
                  )}
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${
                    expandedTutorial === tutorial.id ? 'rotate-90' : ''
                  }`} />
                </Button>
              </div>

              {expandedTutorial === tutorial.id && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-3">Passo a passo:</h4>
                  <ol className="space-y-2">
                    {tutorial.steps.map((step, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>

                  {tutorial.tips && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                        Dicas úteis:
                      </h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {tutorial.tips.map((tip, index) => (
                          <li key={index}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredTutorials.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum tutorial encontrado para sua pesquisa.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Perguntas Frequentes
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {filteredFAQs.map((faq, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <Button
                  variant="ghost"
                  className="w-full text-left p-0 h-auto justify-start mb-2"
                  onClick={() => setExpandedFAQ(
                    expandedFAQ === `faq-${index}` ? null : `faq-${index}`
                  )}
                >
                  <div className="flex items-start gap-2 w-full">
                    <ChevronRight className={`h-4 w-4 mt-0.5 flex-shrink-0 transition-transform ${
                      expandedFAQ === `faq-${index}` ? 'rotate-90' : ''
                    }`} />
                    <span className="text-sm font-medium text-left flex-1">{faq.question}</span>
                  </div>
                </Button>

                {expandedFAQ === `faq-${index}` && (
                  <div className="ml-6 mt-2 space-y-2">
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                    <Badge variant="outline" className="text-xs">
                      {faq.category}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma pergunta encontrada para sua pesquisa.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}