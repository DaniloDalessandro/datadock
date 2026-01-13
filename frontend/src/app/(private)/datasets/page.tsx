"use client"

import { useState, lazy, Suspense } from "react"
import { Search, Plus, Database, Calendar, FileText, Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDatasets } from "@/hooks/useDatasets"
import { useToast } from "@/hooks/use-toast"

const DatasetDialog = lazy(() => import("@/components/datasets/DatasetDialog"))

const BLANK_TARGET = "_blank"

const openDatasetInNewTab = (datasetId: number) => {
  window.open(`/datasets/${datasetId}`, BLANK_TARGET);
};

export default function DatasetsPage() {
  const { datasets, isLoading, createDataset } = useDatasets()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredDatasets = datasets.filter((dataset) =>
    dataset.table_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateDataset = async (data: {
    import_type: 'endpoint' | 'file'
    table_name: string
    endpoint_url?: string
    file?: File
  }) => {
    try {
      await createDataset(data)
      setIsDialogOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar dataset'

      toast({
        title: "Erro ao criar dataset",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo"
      case "inactive":
        return "Inativo"
      default:
        return status
    }
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Dados</h1>
            <p className="text-gray-500 mt-1">Gerenciar conjuntos de dados</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Adicionar Dataset
          </Button>
        </div>

        {searchTerm && (
          <div className="text-sm text-gray-600">
            {filteredDatasets.length} resultado(s) encontrado(s) para &ldquo;{searchTerm}&rdquo;
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDatasets.map((dataset) => (
              <Card
                key={dataset.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openDatasetInNewTab(dataset.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Database className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {dataset.table_name}
                        </CardTitle>
                        <Badge className={`mt-2 ${getStatusColor(dataset.status)}`}>
                          {getStatusLabel(dataset.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 line-clamp-2">
                    {dataset.endpoint_url || 'Dataset importado'}
                  </CardDescription>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{dataset.record_count.toLocaleString()} registros</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Atualizado em {new Date(dataset.updated_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredDatasets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum dataset encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? `Não encontramos datasets com o nome "${searchTerm}"`
                : "Comece adicionando um novo dataset"}
            </p>
            {!searchTerm && (
              <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Dataset
              </Button>
            )}
          </div>
        )}
      </div>

      {isDialogOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
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
