"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Database,
  Download,
  Search,
  RefreshCw,
  ExternalLink,
  Calendar,
  Hash,
  Columns3,
  FileDown,
  ChevronRight,
  BarChart2,
  Layers,
  Menu,
  X,
  Loader2,
  FileText,

} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { config } from "@/lib/config"
import { ColumnFilterPopover, FilterValue } from "@/components/filters"

interface PublicDataset {
  id: number
  table_name: string
  status: string
  status_display: string
  record_count: number
  column_structure: Record<string, unknown>
  created_at: string
  updated_at?: string
}

interface ColumnMetadata {
  name: string
  type: string
  filter_type: string
  unique_values: string[]
}

function StatusBadge({ status, display }: { status: string; display: string }) {
  const colorMap: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    inactive: "bg-gray-100 text-gray-600 border-gray-200",
    processing: "bg-blue-100 text-blue-700 border-blue-200",
    pending: "bg-orange-100 text-orange-700 border-orange-200",
    error: "bg-red-100 text-red-700 border-red-200",
  }
  const cls = colorMap[status] || colorMap.inactive
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {display || status}
    </span>
  )
}

export default function HomePage() {
  const [datasets, setDatasets] = useState<PublicDataset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Explorer sheet state
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [explorerDataset, setExplorerDataset] = useState<PublicDataset | null>(null)
  const [explorerLoading, setExplorerLoading] = useState(false)
  const [explorerColumns, setExplorerColumns] = useState<ColumnMetadata[]>([])
  const [explorerData, setExplorerData] = useState<Record<string, unknown>[]>([])
  const [explorerSearch, setExplorerSearch] = useState("")
  const [explorerPage, setExplorerPage] = useState(1)
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue>>({})
  const ROWS_PER_PAGE = 50

  const fetchDatasets = useCallback(async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/data-import/public-datasets/`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          const list: PublicDataset[] = data.results || []
          setDatasets(list)
          setTotalRecords(list.reduce((acc, d) => acc + (d.record_count || 0), 0))
        }
      }
    } catch (err) {
      console.error("Error fetching datasets:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDatasets()
    autoRefreshRef.current = setInterval(fetchDatasets, 60000)
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [fetchDatasets])

  const openExplorer = async (dataset: PublicDataset) => {
    setExplorerDataset(dataset)
    setExplorerOpen(true)
    setExplorerLoading(true)
    setExplorerColumns([])
    setExplorerData([])
    setExplorerSearch("")
    setActiveFilters({})
    setExplorerPage(1)
    try {
      const [metaRes, dataRes] = await Promise.all([
        fetch(`${config.apiUrl}/api/data-import/public-metadata/${dataset.id}/`),
        fetch(`${config.apiUrl}/api/data-import/public-data/${dataset.id}/`),
      ])
      if (metaRes.ok) {
        const meta = await metaRes.json()
        if (meta.success) setExplorerColumns(meta.columns || [])
      }
      if (dataRes.ok) {
        const d = await dataRes.json()
        if (d.success) setExplorerData(d.data || [])
      }
    } catch {
      toast.error("Erro ao carregar dados do dataset")
    } finally {
      setExplorerLoading(false)
    }
  }

  const handleDownload = async (dataset: PublicDataset, format: string) => {
    try {
      toast.info(`Preparando download em ${format.toUpperCase()}...`)
      const params = new URLSearchParams({ file_format: format })
      const res = await fetch(
        `${config.apiUrl}/api/data-import/public-download/${dataset.id}/?${params}`
      )
      if (!res.ok) throw new Error("Erro no download")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${dataset.table_name}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${dataset.table_name}.${format} baixado com sucesso!`)
    } catch {
      toast.error("Erro ao baixar arquivo")
    }
  }

  const handleExplorerDownloadJson = () => {
    if (!explorerDataset) return
    const blob = new Blob(
      [JSON.stringify(explorerFiltered, null, 2)],
      { type: "application/json" }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${explorerDataset.table_name}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("JSON baixado!")
  }

  const explorerFiltered = useMemo(() => {
    let result = explorerData
    if (explorerSearch.trim()) {
      const kw = explorerSearch.toLowerCase()
      result = result.filter((row) =>
        Object.values(row).some((v) =>
          v !== null && v !== undefined && String(v).toLowerCase().includes(kw)
        )
      )
    }
    if (Object.keys(activeFilters).length === 0) return result
    return result.filter((row) =>
      Object.entries(activeFilters).every(([col, filter]) => {
        if (!filter) return true
        const cell = row[col]
        const str = cell !== null && cell !== undefined ? String(cell).toLowerCase() : ""
        switch (filter.type) {
          case "string": {
            const fv = ((filter.value as string) || "").toLowerCase()
            if (!fv) return true
            switch (filter.operator) {
              case "contains": return str.includes(fv)
              case "equals": return str === fv
              case "startsWith": return str.startsWith(fv)
              case "endsWith": return str.endsWith(fv)
              default: return true
            }
          }
          case "number":
          case "integer":
          case "float": {
            const num = parseFloat(String(cell))
            const fnum = parseFloat(filter.value as string)
            if (isNaN(fnum)) return true
            switch (filter.operator) {
              case "equals": return num === fnum
              case "notEquals": return num !== fnum
              case "greaterThan": return num > fnum
              case "lessThan": return num < fnum
              case "greaterThanOrEqual": return num >= fnum
              case "lessThanOrEqual": return num <= fnum
              case "between": {
                const fnum2 = parseFloat(filter.value2 || "")
                return !isNaN(fnum2) && num >= fnum && num <= fnum2
              }
              default: return true
            }
          }
          case "boolean":
            if (filter.value === "all") return true
            return String(cell).toLowerCase() === (filter.value as string)
          case "category": {
            const vals = filter.value as string[]
            if (!vals || vals.length === 0) return true
            return vals.some((v) => String(cell).toLowerCase() === v.toLowerCase())
          }
          case "date":
          case "datetime": {
            const dv = new Date(String(cell))
            const fd = new Date(filter.value as string)
            if (isNaN(fd.getTime())) return true
            switch (filter.operator) {
              case "equals": return dv.toDateString() === fd.toDateString()
              case "before": return dv < fd
              case "after": return dv > fd
              case "between": {
                const fd2 = new Date(filter.value2 || "")
                return !isNaN(fd2.getTime()) && dv >= fd && dv <= fd2
              }
              default: return true
            }
          }
          default: return true
        }
      })
    )
  }, [explorerData, explorerSearch, activeFilters])

  const filteredDatasets = datasets.filter((d) =>
    d.table_name.toLowerCase().includes(search.toLowerCase())
  )
  const explorerPageCount = Math.max(1, Math.ceil(explorerFiltered.length / ROWS_PER_PAGE))
  const explorerPageData = explorerFiltered.slice(
    (explorerPage - 1) * ROWS_PER_PAGE,
    explorerPage * ROWS_PER_PAGE
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-md">
                <Database className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-base">DataDock</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/home"
                className="px-3 py-1.5 text-sm text-blue-600 font-medium rounded-md bg-blue-50"
              >
                Início
              </Link>
              <Link
                href="/datasets-publicos"
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Datasets
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
              >
                Portal Interno
                <ExternalLink className="h-3 w-3" />
              </Link>
            </nav>
            <button
              className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white py-2 px-4 flex flex-col gap-1">
            <Link href="/home" className="py-2 text-sm text-blue-600 font-medium">Início</Link>
            <Link href="/datasets-publicos" className="py-2 text-sm text-gray-600">Datasets</Link>
            <Link href="/dashboard" className="py-2 text-sm text-gray-600 flex items-center gap-1">
              Portal Interno <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-500 p-2 rounded-lg">
                <BarChart2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-400 text-sm font-medium uppercase tracking-wide">
                Portal de Dados Abertos
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">DataDock</h1>
            <p className="text-slate-300 text-lg mb-8">Portal de Dados Portuários</p>

            {/* Live stats */}
            <div className="flex flex-wrap gap-6">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-36 bg-slate-700" />
                  <Skeleton className="h-12 w-36 bg-slate-700" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                      <Layers className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{datasets.length}</p>
                      <p className="text-xs text-slate-400">Datasets disponíveis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600/20 p-2 rounded-lg border border-green-500/30">
                      <FileText className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {totalRecords >= 1000000
                          ? `${(totalRecords / 1000000).toFixed(1)}M`
                          : totalRecords >= 1000
                          ? `${(totalRecords / 1000).toFixed(0)}K`
                          : totalRecords.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs text-slate-400">Total de registros</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Catalog + Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12 flex-1 w-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Datasets Disponíveis</h2>
            {!isLoading && filteredDatasets.length > 0 && (
              <p className="text-sm text-gray-400 mt-0.5">
                {filteredDatasets.length} {filteredDatasets.length === 1 ? "dataset" : "datasets"} disponível{filteredDatasets.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar datasets..."
                className="pl-9 w-64 bg-white border-gray-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchDatasets}
              title="Atualizar"
              className="border-gray-200"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="flex gap-2 mt-5">
                  <Skeleton className="h-8 flex-1 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Database className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p className="text-base font-medium text-gray-500">Nenhum dataset encontrado</p>
            <p className="text-sm mt-1">
              {search ? `Sem resultados para "${search}"` : "Nenhum dataset público disponível"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredDatasets.map((dataset) => (
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
                  onClick={() => window.open(`/datasets-publicos?id=${dataset.id}`, "_blank")}
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
                    <span>{new Date(dataset.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(`/datasets-publicos?id=${dataset.id}`, "_blank")}
                  >
                    <ChevronRight className="h-3.5 w-3.5 mr-1" />
                    Explorar
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-gray-200"
                        title="Baixar dados"
                      >
                        <FileDown className="h-3.5 w-3.5 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={() => handleDownload(dataset, "csv")}
                        className="text-sm"
                      >
                        <Download className="h-3.5 w-3.5 mr-2" />
                        CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(dataset, "xlsx")}
                        className="text-sm"
                      >
                        <Download className="h-3.5 w-3.5 mr-2" />
                        Excel (xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(dataset, "json")}
                        className="text-sm"
                      >
                        <Download className="h-3.5 w-3.5 mr-2" />
                        JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1 rounded">
              <Database className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">DataDock</span>
            <span className="text-sm text-gray-400">— Portal de Dados Portuários</span>
          </div>
          <p className="text-xs text-gray-400">
            Dados atualizados automaticamente a cada 60 segundos
          </p>
        </div>
      </footer>

      {/* Data Explorer Sheet */}
      <Sheet open={explorerOpen} onOpenChange={setExplorerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-none sm:w-[90vw] lg:w-[80vw] p-0 flex flex-col"
        >
          <SheetHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <SheetTitle className="text-base font-semibold text-gray-900">
                    {explorerDataset?.table_name}
                  </SheetTitle>
                  {explorerDataset && (
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Hash className="h-3 w-3" />
                        {explorerDataset.record_count.toLocaleString("pt-BR")} registros
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Columns3 className="h-3 w-3" />
                        {Object.keys(explorerDataset.column_structure || {}).length} colunas
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(explorerDataset.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {explorerDataset && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Download className="h-3.5 w-3.5" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() => handleDownload(explorerDataset, "csv")}
                      className="text-sm"
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDownload(explorerDataset, "xlsx")}
                      className="text-sm"
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Excel (xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExplorerDownloadJson}
                      className="text-sm"
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      JSON (filtrado)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </SheetHeader>

          {/* Explorer toolbar */}
          <div className="flex-shrink-0 px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Buscar em todas as colunas..."
                className="pl-8 h-8 text-sm bg-white border-gray-200"
                value={explorerSearch}
                onChange={(e) => {
                  setExplorerSearch(e.target.value)
                  setExplorerPage(1)
                }}
              />
            </div>
            {Object.keys(activeFilters).length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {Object.keys(activeFilters).length} filtro
                {Object.keys(activeFilters).length !== 1 ? "s" : ""} ativo
                {Object.keys(activeFilters).length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Table area */}
          <div className="flex-1 overflow-auto">
            {explorerLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
                <span className="text-gray-600">Carregando dados...</span>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="py-2.5 px-4 text-xs font-semibold text-gray-500 w-12">
                      #
                    </TableHead>
                    {explorerColumns.map((col) => (
                      <TableHead
                        key={col.name}
                        className="py-2.5 px-4 text-xs font-semibold text-gray-700 min-w-[140px] bg-gray-50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{col.name}</span>
                          <ColumnFilterPopover
                            column={col.name}
                            columnType={col.filter_type}
                            uniqueValues={col.unique_values}
                            value={activeFilters[col.name]}
                            onChange={(value) => {
                              setActiveFilters((prev) => {
                                if (value === null) {
                                  const n = { ...prev }
                                  delete n[col.name]
                                  return n
                                }
                                return { ...prev, [col.name]: value }
                              })
                              setExplorerPage(1)
                            }}
                            isActive={!!activeFilters[col.name]}
                          />
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {explorerPageData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={explorerColumns.length + 1}
                        className="text-center py-16 text-gray-500"
                      >
                        Nenhum registro encontrado com os filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    explorerPageData.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50">
                        <TableCell className="py-2 px-4 text-xs text-gray-400 font-mono">
                          {(explorerPage - 1) * ROWS_PER_PAGE + idx + 1}
                        </TableCell>
                        {explorerColumns.map((col) => (
                          <TableCell key={col.name} className="py-2 px-4 text-sm text-gray-800">
                            {row[col.name] !== null && row[col.name] !== undefined
                              ? String(row[col.name])
                              : <span className="text-gray-300">—</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination footer */}
          {!explorerLoading && explorerFiltered.length > 0 && (
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white text-sm text-gray-600">
              <span>
                Mostrando{" "}
                <span className="font-medium text-gray-900">
                  {(explorerPage - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(explorerPage * ROWS_PER_PAGE, explorerFiltered.length)}
                </span>{" "}
                de{" "}
                <span className="font-medium text-gray-900">
                  {explorerFiltered.length}
                </span>{" "}
                registros
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={explorerPage <= 1}
                  onClick={() => setExplorerPage((p) => p - 1)}
                  className="h-7 px-3 text-xs"
                >
                  Anterior
                </Button>
                <span className="text-xs text-gray-500">
                  Página {explorerPage} de {explorerPageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={explorerPage >= explorerPageCount}
                  onClick={() => setExplorerPage((p) => p + 1)}
                  className="h-7 px-3 text-xs"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
