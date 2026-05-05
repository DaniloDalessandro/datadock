"use client"

import { useState, lazy, Suspense } from "react"
import { Search, Plus, Database, Calendar, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useDatasets } from "@/hooks/useDatasets"
import { useToast } from "@/hooks/use-toast"

const DatasetDialog = lazy(() => import("@/components/datasets/DatasetDialog"))

const openDatasetInNewTab = (datasetId: number) => {
  window.open(`/datasets/${datasetId}`, "_blank")
}

export default function DatasetsPage() {
  const { datasets, isLoading, createDataset } = useDatasets()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredDatasets = datasets.filter((dataset) =>
    dataset.table_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateDataset = async (data: {
    import_type: "endpoint" | "file"
    table_name: string
    endpoint_url?: string
    file?: File
  }) => {
    try {
      await createDataset(data)
      setIsDialogOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar dataset"
      toast({
        title: "Erro ao criar dataset",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    }
  }

  const getStatusVariant = (status: string): "success" | "secondary" => {
    return status === "active" ? "success" : "secondary"
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Ativo"
      case "inactive": return "Inativo"
      default: return status
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-[#f5f5f7] p-8 pb-6 border-b border-[#e0e0e0]">
        <div className="mb-6">
          <h1 className="text-[34px] font-semibold text-[#1d1d1f] leading-[1.47] tracking-[-0.374px]">
            Gestão de Dados
          </h1>
          <p className="text-[17px] text-[#7a7a7a] mt-1 leading-[1.47] tracking-[-0.374px]">Gerenciar conjuntos de dados</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7a7a]" />
            <Input
              type="text"
              variant="search"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Dataset
          </Button>
        </div>

        {searchTerm && (
          <p className="text-sm text-[#7a7a7a] mt-4">
            {filteredDatasets.length} resultado(s) encontrado(s) para &ldquo;{searchTerm}&rdquo;
          </p>
        )}
      </section>

      {/* Content section */}
      <section className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-6 w-6 animate-spin text-[#1d1d1f]" />
              </div>
              <p className="text-sm text-[#7a7a7a] font-medium">Carregando datasets...</p>
            </div>
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-6">
              <Database className="h-8 w-8 text-[#7a7a7a]" />
            </div>
            <h3 className="text-[24px] font-bold text-[#1d1d1f] mb-2 tracking-[-0.02em]">
              Nenhum dataset encontrado
            </h3>
            <p className="text-[#7a7a7a] text-sm mb-6 max-w-sm leading-[1.43]">
              {searchTerm
                ? `Não encontramos datasets com o nome "${searchTerm}"`
                : "Comece adicionando um novo dataset ao sistema"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Dataset
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDatasets.map((dataset) => (
              <div
                key={dataset.id}
                className="border border-[#e0e0e0] bg-[#ffffff] rounded-[18px] cursor-pointer transition-all duration-200 hover:border-[#0066cc] group overflow-hidden"
                onClick={() => openDatasetInNewTab(dataset.id)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#f5f5f7] rounded-full flex items-center justify-center flex-shrink-0">
                      <Database className="h-5 w-5 text-[#1d1d1f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#1d1d1f] truncate text-base leading-tight">
                        {dataset.table_name}
                      </h3>
                      <div className="mt-2">
                        <Badge variant={getStatusVariant(dataset.status)}>
                          {getStatusLabel(dataset.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-[#7a7a7a] mb-4 line-clamp-2 leading-[1.43]">
                    {dataset.endpoint_url || "Dataset importado"}
                  </p>

                  <div className="space-y-2 text-sm text-[#7a7a7a]">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#7a7a7a]" />
                      <span>{dataset.record_count.toLocaleString()} registros</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#7a7a7a]" />
                      <span>
                        Atualizado em {new Date(dataset.updated_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isDialogOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-[#000000]/40 flex items-center justify-center z-50">
              <div className="bg-[#ffffff] p-8 rounded-[18px] border border-[#e0e0e0] flex items-center gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                <Loader2 className="h-5 w-5 animate-spin text-[#1d1d1f]" />
                <span className="text-sm font-bold text-[#1d1d1f]">Carregando...</span>
              </div>
            </div>
          }
        >
          <DatasetDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onSubmit={handleCreateDataset}
          />
        </Suspense>
      )}
    </div>
  )
}
