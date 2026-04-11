"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import {
  Search,
  Plus,
  Database,
  Eye,
  RefreshCw,
  MoreHorizontal,
  Hash,
  Columns3,
  Calendar,
  Filter,
  Loader2,
  Archive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDatasets, type Dataset } from "@/hooks/useDatasets"
import { toast } from "sonner"

const DatasetDialog = lazy(() => import("@/components/datasets/DatasetDialog"))

type StatusFilter = "all" | "active" | "inactive" | "processing" | "pending"

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  processing: "Processando",
  pending: "Pendente",
  error: "Erro",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  error: "bg-red-100 text-red-700 border-red-200",
}

function StatusBadge({ status, display }: { status: string; display?: string }) {
  const cls = STATUS_COLORS[status] || STATUS_COLORS.inactive
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {display || STATUS_LABELS[status] || status}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-3" />
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  )
}

function exportDatasetsCsv(datasets: Dataset[]) {
  const headers = ["ID", "Nome", "Status", "Registros", "Colunas", "Atualizado"]
  const rows = datasets.map((d) => [
    d.id,
    `"${d.table_name}"`,
    d.status_display || d.status,
    d.record_count,
    Object.keys(d.column_structure || {}).length,
    new Date(d.updated_at).toLocaleDateString("pt-BR"),
  ])
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "datasets.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function DatasetsPage() {
  const { datasets, isLoading, createDataset, fetchDatasets } = useDatasets()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async (silent = false) => {
    setIsRefreshing(true)
    await fetchDatasets()
    setIsRefreshing(false)
    if (!silent) toast.success("Lista atualizada!")
  }

  useEffect(() => {
    const id = setInterval(() => {
      fetchDatasets()
    }, 30000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateDataset = async (data: {
    import_type: "endpoint" | "file"
    table_name: string
    endpoint_url?: string
    file?: File
  }) => {
    try {
      await createDataset(data)
      setIsDialogOpen(false)
      toast.success("Dataset criado com sucesso!")
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao criar dataset"
      toast.error(msg)
      throw error
    }
  }

  const filtered = datasets.filter((d) => {
    const matchSearch = d.table_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === "all" || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const hasFilters = searchTerm !== "" || statusFilter !== "all"

  return (
    <div className="flex flex-col h-full p-6 bg-slate-50 min-h-screen">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Datasets</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {datasets.length} dataset{datasets.length !== 1 ? "s" : ""} no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Adicionar Dataset
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-8 h-8 text-sm border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-48 h-8 text-xs border-gray-200">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todos os status</SelectItem>
            <SelectItem value="active" className="text-xs">Ativo</SelectItem>
            <SelectItem value="inactive" className="text-xs">Inativo</SelectItem>
            <SelectItem value="processing" className="text-xs">Processando</SelectItem>
            <SelectItem value="pending" className="text-xs">Pendente</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-gray-200"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>

        {hasFilters && (
          <button
            onClick={() => { setSearchTerm(""); setStatusFilter("all") }}
            className="text-xs text-red-500 hover:text-red-700 underline ml-1"
          >
            Limpar filtros
          </button>
        )}

        {hasFilters && !isLoading && (
          <span className="text-xs text-gray-500 ml-auto">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-gray-100 p-5 rounded-2xl mb-4">
            <Database className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-700 text-lg mb-1">
            Nenhum dataset encontrado
          </h3>
          <p className="text-sm text-gray-500 max-w-xs mb-4">
            {hasFilters
              ? "Tente ajustar os filtros de busca"
              : "Comece adicionando seu primeiro dataset"}
          </p>
          {!hasFilters && (
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar Primeiro Dataset
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((dataset) => (
              <div
                key={dataset.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                  <StatusBadge status={dataset.status} display={dataset.status_display} />
                </div>

                {/* Title */}
                <h3
                  className="font-semibold text-gray-900 text-sm leading-snug mb-3 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => window.open(`/datasets/${dataset.id}`, "_blank")}
                >
                  {dataset.table_name}
                </h3>

                {/* Metadata */}
                <div className="space-y-1.5 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-gray-700">
                        {dataset.record_count.toLocaleString("pt-BR")}
                      </span>{" "}
                      registros
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Columns3 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-gray-700">
                        {Object.keys(dataset.column_structure || {}).length}
                      </span>{" "}
                      colunas
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>{new Date(dataset.updated_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {dataset.endpoint_url && (
                    <p className="text-xs text-gray-400 truncate" title={dataset.endpoint_url}>
                      {dataset.endpoint_url}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(`/datasets/${dataset.id}`, "_blank")}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Abrir
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-gray-200"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuLabel className="text-xs text-gray-500">Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-xs"
                        onClick={() => window.open(`/datasets/${dataset.id}`, "_blank")}
                      >
                        <Eye className="h-3.5 w-3.5 mr-2" />
                        Abrir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-xs text-orange-600 focus:text-orange-700"
                        onClick={() => toast.info(`Arquivando "${dataset.table_name}"...`)}
                      >
                        <Archive className="h-3.5 w-3.5 mr-2" />
                        Arquivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-gray-400 text-right">
            {filtered.length}{" "}
            {filtered.length === 1 ? "dataset" : "datasets"}
            {hasFilters && ` de ${datasets.length} total`}
            {" · "}Atualizado automaticamente a cada 30s
          </div>
        </>
      )}

      {/* Dataset creation dialog */}
      {isDialogOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
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
