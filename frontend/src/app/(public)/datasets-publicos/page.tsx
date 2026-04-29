"use client"

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Database,
  Search,
  Download,
  RefreshCw,
  Loader2,
  Hash,
  Columns3,
  Calendar,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Filter,
  FileDown,
  Table2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { config } from "@/lib/config"
import { ColumnFilterPopover, FilterValue } from "@/components/filters"
import { StatusBadge } from "@/components/ui/status-badge"

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

type SortDirection = "asc" | "desc" | null

function SortIcon({ column, sortColumn, sortDirection }: {
  column: string; sortColumn: string | null; sortDirection: SortDirection
}) {
  if (sortColumn !== column) return <ChevronsUpDown className="h-3.5 w-3.5 ml-1 flex-shrink-0" style={{ color: "#929292" }} />
  if (sortDirection === "asc")  return <ChevronUp    className="h-3.5 w-3.5 ml-1 flex-shrink-0" style={{ color: "#ff385c" }} />
  return <ChevronDown className="h-3.5 w-3.5 ml-1 flex-shrink-0" style={{ color: "#ff385c" }} />
}

const ROWS_PER_PAGE = 50

function DatasetsPublicosContent() {
  const [datasets, setDatasets] = useState<PublicDataset[]>([])
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true)
  const [datasetSearch, setDatasetSearch] = useState("")
  const [selectedDataset, setSelectedDataset] = useState<PublicDataset | null>(null)

  const [isLoadingData, setIsLoadingData] = useState(false)
  const [columnMetadata, setColumnMetadata] = useState<ColumnMetadata[]>([])
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([])
  const [globalSearch, setGlobalSearch] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue>>({})
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoOpenedRef = useRef(false)
  const searchParams = useSearchParams()
  const autoOpenId = searchParams.get("id")

  const fetchDatasets = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingDatasets(true)
    try {
      const res = await fetch(`${config.apiUrl}/api/data-import/public-datasets/`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) setDatasets(data.results || [])
      }
    } catch (err) {
      console.error("Error fetching datasets:", err)
    } finally {
      setIsLoadingDatasets(false)
    }
  }, [])

  useEffect(() => {
    fetchDatasets()
    autoRefreshRef.current = setInterval(() => fetchDatasets(true), 60000)
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current) }
  }, [fetchDatasets])

  const loadDataset = useCallback(async (dataset: PublicDataset) => {
    setSelectedDataset(dataset)
    setIsLoadingData(true)
    setRawData([])
    setColumnMetadata([])
    setVisibleColumns(new Set())
    setGlobalSearch("")
    setActiveFilters({})
    setSortColumn(null)
    setSortDirection(null)
    setCurrentPage(1)

    try {
      const [metaRes, dataRes] = await Promise.all([
        fetch(`${config.apiUrl}/api/data-import/public-metadata/${dataset.id}/`),
        fetch(`${config.apiUrl}/api/data-import/public-data/${dataset.id}/`),
      ])
      if (metaRes.ok) {
        const meta = await metaRes.json()
        if (meta.success) {
          const cols: ColumnMetadata[] = meta.columns || []
          setColumnMetadata(cols)
          setVisibleColumns(new Set(cols.map((c) => c.name)))
        }
      }
      if (dataRes.ok) {
        const d = await dataRes.json()
        if (d.success) setRawData(d.data || [])
      }
    } catch {
      toast.error("Erro ao carregar dados do dataset")
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (!autoOpenId || autoOpenedRef.current || datasets.length === 0) return
    const target = datasets.find((d) => String(d.id) === autoOpenId)
    if (target) { autoOpenedRef.current = true; loadDataset(target) }
  }, [autoOpenId, datasets, loadDataset])

  const displayData = useMemo((): Record<string, unknown>[] => {
    let data = rawData

    if (globalSearch.trim()) {
      const kw = globalSearch.toLowerCase()
      data = data.filter((row) =>
        Object.values(row).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(kw))
      )
    }

    if (Object.keys(activeFilters).length > 0) {
      data = data.filter((row) =>
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
            case "number": case "integer": case "float": {
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
                case "between": { const fnum2 = parseFloat(filter.value2 || ""); return !isNaN(fnum2) && num >= fnum && num <= fnum2 }
                default: return true
              }
            }
            case "boolean": return filter.value === "all" ? true : String(cell).toLowerCase() === (filter.value as string)
            case "category": { const vals = filter.value as string[]; if (!vals || vals.length === 0) return true; return vals.some((v) => String(cell).toLowerCase() === v.toLowerCase()) }
            case "date": case "datetime": {
              const dv = new Date(String(cell)); const fd = new Date(filter.value as string)
              if (isNaN(fd.getTime())) return true
              switch (filter.operator) {
                case "equals": return dv.toDateString() === fd.toDateString()
                case "before": return dv < fd
                case "after": return dv > fd
                case "between": { const fd2 = new Date(filter.value2 || ""); return !isNaN(fd2.getTime()) && dv >= fd && dv <= fd2 }
                default: return true
              }
            }
            default: return true
          }
        })
      )
    }

    if (sortColumn && sortDirection) {
      data = [...data].sort((a, b) => {
        const av = a[sortColumn]; const bv = b[sortColumn]
        if (av === null || av === undefined) return 1
        if (bv === null || bv === undefined) return -1
        const comparison = typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "pt-BR")
        return sortDirection === "asc" ? comparison : -comparison
      })
    }

    return data
  }, [rawData, globalSearch, activeFilters, sortColumn, sortDirection])

  const pageCount = Math.max(1, Math.ceil(displayData.length / ROWS_PER_PAGE))
  const pageData = displayData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
  const visibleCols = columnMetadata.filter((c) => visibleColumns.has(c.name))

  const computeNumericStats = (data: Record<string, unknown>[], cols: ColumnMetadata[]) => {
    const stats: Record<string, { min: number; max: number; avg: number }> = {}
    if (data.length === 0) return stats
    for (const col of cols.filter((c) => ["integer","float","number"].includes(c.type))) {
      const vals = data.map((r) => parseFloat(String(r[col.name]))).filter((v) => !isNaN(v))
      if (vals.length > 0) {
        stats[col.name] = { min: Math.min(...vals), max: Math.max(...vals), avg: vals.reduce((a,b) => a+b, 0) / vals.length }
      }
    }
    return stats
  }

  const handleSort = (col: string) => {
    if (sortColumn !== col) { setSortColumn(col); setSortDirection("asc") }
    else if (sortDirection === "asc") setSortDirection("desc")
    else { setSortColumn(null); setSortDirection(null) }
    setCurrentPage(1)
  }

  const handleExport = async (format: string) => {
    if (!selectedDataset) return
    try {
      toast.info(`Preparando exportação em ${format.toUpperCase()}...`)
      if (format === "json") {
        const blob = new Blob([JSON.stringify(displayData, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a"); a.href = url; a.download = `${selectedDataset.table_name}.json`; a.click(); URL.revokeObjectURL(url)
        toast.success("JSON exportado com sucesso!"); return
      }
      const cols = Array.from(visibleColumns)
      const params = new URLSearchParams({ file_format: format })
      if (cols.length > 0) params.append("columns", cols.join(","))
      if (Object.keys(activeFilters).length > 0) params.append("filters", JSON.stringify(activeFilters))
      const res = await fetch(`${config.apiUrl}/api/data-import/public-download/${selectedDataset.id}/?${params}`)
      if (!res.ok) throw new Error("Erro no download")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = `${selectedDataset.table_name}.${format}`; a.click(); URL.revokeObjectURL(url)
      toast.success(`${selectedDataset.table_name}.${format} exportado com sucesso!`)
    } catch { toast.error("Erro ao exportar arquivo") }
  }

  const sidebarDatasets = datasets.filter((d) => d.table_name.toLowerCase().includes(datasetSearch.toLowerCase()))
  const stats = computeNumericStats(displayData, columnMetadata)
  const statsEntries = Object.entries(stats)

  const btnOutline: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #dddddd",
    color: "#3f3f3f",
    borderRadius: "8px",
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#ffffff" }}>
      {/* ── Sidebar ── */}
      <div className={`flex-shrink-0 flex flex-col transition-all duration-200 ${sidebarOpen ? "w-72" : "w-0 overflow-hidden"} md:w-72 md:overflow-visible`}
        style={{ background: "#f7f7f7", borderRight: "1px solid #ebebeb" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #ebebeb" }}>
          <h2 className="text-sm font-medium" style={{ color: "#222222" }}>Datasets</h2>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded transition-colors"
            style={{ color: "#929292" }}>
            <Eye className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 py-2" style={{ borderBottom: "1px solid #ebebeb" }}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#929292" }} />
            <Input
              placeholder="Buscar..."
              className="pl-8 h-8 text-xs"
              style={{ background: "#ffffff", border: "1px solid #dddddd", color: "#222222", borderRadius: "8px" }}
              value={datasetSearch}
              onChange={(e) => setDatasetSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoadingDatasets ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg space-y-1.5">
                  <Skeleton className="h-3.5 w-full" style={{ background: "#ebebeb" }} />
                  <Skeleton className="h-3 w-20" style={{ background: "#ebebeb" }} />
                </div>
              ))}
            </div>
          ) : sidebarDatasets.length === 0 ? (
            <div className="p-4 text-center text-sm" style={{ color: "#929292" }}>Nenhum dataset encontrado</div>
          ) : (
            <div className="p-2 space-y-0.5">
              {sidebarDatasets.map((ds) => {
                const isSelected = selectedDataset?.id === ds.id
                return (
                  <button key={ds.id} onClick={() => loadDataset(ds)}
                    className="w-full text-left px-3 py-2.5 rounded-lg transition-colors"
                    style={isSelected
                      ? {
                          background: "rgba(255,56,92,0.06)",
                          border: "1px solid rgba(255,56,92,0.20)",
                          boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px",
                        }
                      : { background: "transparent", border: "1px solid transparent" }
                    }
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f2f2f2" }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium truncate" style={{ color: isSelected ? "#ff385c" : "#222222" }}>
                        {ds.table_name}
                      </span>
                      <StatusBadge status={ds.status}>{ds.status_display || ds.status}</StatusBadge>
                    </div>
                    <span className="text-xs flex items-center gap-1" style={{ color: "#929292" }}>
                      <Hash className="h-3 w-3" />{ds.record_count.toLocaleString("pt-BR")} registros
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!selectedDataset ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center px-8">
            {!sidebarOpen && (
              <Button variant="outline" size="sm" onClick={() => setSidebarOpen(true)} className="mb-4" style={btnOutline}>
                <Eye className="h-4 w-4 mr-2" />Mostrar datasets
              </Button>
            )}
            <div className="p-5 rounded-2xl" style={{ background: "rgba(255,56,92,0.06)", border: "1px solid rgba(255,56,92,0.15)" }}>
              <Table2 className="h-12 w-12" style={{ color: "#ff385c" }} />
            </div>
            <h3 className="text-lg font-medium" style={{ color: "#222222" }}>Selecione um dataset para explorar</h3>
            <p className="text-sm max-w-xs" style={{ color: "#6a6a6a" }}>
              Escolha um dataset na barra lateral para visualizar, filtrar e exportar os dados
            </p>
          </div>
        ) : (
          <>
            {/* Header bar */}
            <div className="flex-shrink-0 px-6 py-3" style={{ background: "#ffffff", borderBottom: "1px solid #ebebeb" }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {!sidebarOpen && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setSidebarOpen(true)} title="Mostrar sidebar"
                      style={{ color: "#929292" }}>
                      <Database className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="p-1.5 rounded-md flex-shrink-0" style={{ background: "rgba(255,56,92,0.06)" }}>
                    <Database className="h-4 w-4" style={{ color: "#ff385c" }} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm font-medium truncate" style={{ color: "#222222" }}>{selectedDataset.table_name}</h1>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#929292" }}>
                        <Hash className="h-3 w-3" />{selectedDataset.record_count.toLocaleString("pt-BR")} registros
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#929292" }}>
                        <Columns3 className="h-3 w-3" />{columnMetadata.length} colunas
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#929292" }}>
                        <Calendar className="h-3 w-3" />{new Date(selectedDataset.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadDataset(selectedDataset)} title="Atualizar"
                    style={{ color: "#929292" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#222222")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#929292")}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" style={btnOutline}>
                        <FileDown className="h-3.5 w-3.5" />Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuLabel className="text-xs" style={{ color: "#929292" }}>Dados filtrados</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {["csv", "xlsx", "json"].map((fmt) => (
                        <DropdownMenuItem key={fmt} onClick={() => handleExport(fmt)} className="text-sm">
                          <Download className="h-3.5 w-3.5 mr-2" />{fmt === "xlsx" ? "Excel (xlsx)" : fmt.toUpperCase()}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex-shrink-0 px-6 py-2.5 flex items-center gap-2 flex-wrap"
              style={{ background: "#f7f7f7", borderBottom: "1px solid #ebebeb" }}>
              <div className="relative flex-1 min-w-40 max-w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#929292" }} />
                <Input
                  placeholder="Buscar em todas as colunas..."
                  className="pl-8 h-8 text-xs"
                  style={{ background: "#ffffff", border: "1px solid #dddddd", color: "#222222", borderRadius: "8px" }}
                  value={globalSearch}
                  onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1) }}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" style={btnOutline}>
                    <EyeOff className="h-3.5 w-3.5" />Colunas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
                  <DropdownMenuLabel className="text-xs">Visibilidade das colunas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.size === columnMetadata.length}
                    onCheckedChange={(checked) => {
                      setVisibleColumns(checked ? new Set(columnMetadata.map((c) => c.name)) : new Set())
                    }}
                    className="text-xs font-medium">
                    Todas as colunas
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {columnMetadata.map((col) => (
                    <DropdownMenuCheckboxItem key={col.name} checked={visibleColumns.has(col.name)} className="text-xs"
                      onCheckedChange={(checked) => {
                        setVisibleColumns((prev) => { const next = new Set(prev); checked ? next.add(col.name) : next.delete(col.name); return next })
                      }}>
                      {col.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" style={btnOutline}>
                    <ChevronsUpDown className="h-3.5 w-3.5" />
                    Ordenar
                    {sortColumn && <span className="font-medium" style={{ color: "#ff385c" }}>: {sortColumn} ({sortDirection})</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
                  <DropdownMenuLabel className="text-xs">Ordenar por coluna</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sortColumn && (
                    <>
                      <DropdownMenuItem className="text-xs" onClick={() => { setSortColumn(null); setSortDirection(null) }}>
                        Remover ordenação
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {columnMetadata.map((col) => (
                    <DropdownMenuItem key={col.name} className="text-xs flex items-center justify-between" onClick={() => handleSort(col.name)}>
                      <span>{col.name}</span>
                      {sortColumn === col.name && <span style={{ color: "#ff385c" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {Object.keys(activeFilters).length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ color: "#ff385c", background: "rgba(255,56,92,0.06)", border: "1px solid rgba(255,56,92,0.20)" }}>
                    <Filter className="h-3 w-3" />
                    {Object.keys(activeFilters).length} filtro{Object.keys(activeFilters).length !== 1 ? "s" : ""}
                  </span>
                  <button onClick={() => { setActiveFilters({}); setCurrentPage(1) }}
                    className="text-xs underline" style={{ color: "#c13515" }}>
                    Limpar
                  </button>
                </div>
              )}
            </div>

            {/* Data table */}
            <div className="flex-1 overflow-auto" style={{ background: "#ffffff" }}>
              {isLoadingData ? (
                <div className="flex items-center justify-center h-64 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#ff385c" }} />
                  <span style={{ color: "#6a6a6a" }}>Carregando dados...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="border-0 hover:bg-transparent" style={{ background: "#f7f7f7", borderBottom: "1px solid #ebebeb" }}>
                      <TableHead className="py-2.5 px-4 text-xs border-0 w-12" style={{ color: "#929292", fontWeight: 510, background: "#f7f7f7" }}>#</TableHead>
                      {visibleCols.map((col) => (
                        <TableHead key={col.name}
                          className="py-2.5 px-4 text-xs border-0 min-w-[140px] cursor-pointer select-none"
                          style={{ color: "#929292", fontWeight: 510, background: "#f7f7f7" }}
                          onClick={() => handleSort(col.name)}>
                          <div className="flex items-center gap-1">
                            <div onClick={(e) => e.stopPropagation()}>
                              <ColumnFilterPopover column={col.name} columnType={col.filter_type} uniqueValues={col.unique_values}
                                value={activeFilters[col.name]}
                                onChange={(value) => {
                                  setActiveFilters((prev) => {
                                    if (value === null) { const n = { ...prev }; delete n[col.name]; return n }
                                    return { ...prev, [col.name]: value }
                                  })
                                  setCurrentPage(1)
                                }}
                                isActive={!!activeFilters[col.name]}
                              />
                            </div>
                            <span>{col.name}</span>
                            <SortIcon column={col.name} sortColumn={sortColumn} sortDirection={sortDirection} />
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={visibleCols.length + 1} className="text-center py-16 border-0">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "#929292" }} />
                          <p className="font-medium" style={{ color: "#6a6a6a" }}>Nenhum registro encontrado</p>
                          <p className="text-xs mt-1" style={{ color: "#929292" }}>Tente ajustar os filtros ou a busca</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageData.map((row, idx) => (
                        <TableRow key={idx} className="border-0 transition-colors duration-100"
                          style={{ borderTop: "1px solid #ebebeb" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f7")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <TableCell className="py-2 px-4 text-xs border-0 font-mono" style={{ color: "#929292" }}>
                            {(currentPage - 1) * ROWS_PER_PAGE + idx + 1}
                          </TableCell>
                          {visibleCols.map((col) => (
                            <TableCell key={col.name} className="py-2 px-4 text-sm border-0" style={{ color: "#3f3f3f" }}>
                              {row[col.name] !== null && row[col.name] !== undefined
                                ? String(row[col.name])
                                : <span style={{ color: "#929292" }}>—</span>
                              }
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Stats strip */}
            {!isLoadingData && statsEntries.length > 0 && (
              <div className="flex-shrink-0 px-6 py-2 overflow-x-auto"
                style={{ background: "#f7f7f7", borderTop: "1px solid #ebebeb" }}>
                <div className="flex items-center gap-3 text-xs whitespace-nowrap">
                  <span className="font-medium flex-shrink-0" style={{ color: "#929292" }}>Estatísticas:</span>
                  {statsEntries.slice(0, 6).map(([col, s]) => (
                    <span key={col} className="flex items-center gap-2 px-2.5 py-1 rounded"
                      style={{ background: "#ffffff", border: "1px solid #ebebeb", color: "#6a6a6a" }}>
                      <span className="font-medium" style={{ color: "#222222" }}>{col}:</span>
                      <span>mín <b style={{ color: "#222222" }}>{s.min.toFixed(2)}</b></span>
                      <span style={{ color: "#929292" }}>·</span>
                      <span>máx <b style={{ color: "#222222" }}>{s.max.toFixed(2)}</b></span>
                      <span style={{ color: "#929292" }}>·</span>
                      <span>média <b style={{ color: "#222222" }}>{s.avg.toFixed(2)}</b></span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {!isLoadingData && displayData.length > 0 && (
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 text-sm"
                style={{ background: "#ffffff", borderTop: "1px solid #ebebeb", color: "#6a6a6a" }}>
                <span>
                  Mostrando{" "}
                  <span style={{ color: "#222222", fontWeight: 500 }}>
                    {(currentPage - 1) * ROWS_PER_PAGE + 1}–{Math.min(currentPage * ROWS_PER_PAGE, displayData.length)}
                  </span>{" "}
                  de{" "}
                  <span style={{ color: "#222222", fontWeight: 500 }}>{displayData.length}</span>{" "}
                  registros
                  {displayData.length !== rawData.length && (
                    <span className="ml-1" style={{ color: "#929292" }}>(filtrado de {rawData.length})</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)} className="h-7 px-3 text-xs" style={btnOutline}>
                    Anterior
                  </Button>
                  <span className="text-xs" style={{ color: "#929292" }}>Página {currentPage} de {pageCount}</span>
                  <Button variant="outline" size="sm" disabled={currentPage >= pageCount}
                    onClick={() => setCurrentPage((p) => p + 1)} className="h-7 px-3 text-xs" style={btnOutline}>
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function DatasetsPublicosPage() {
  return (
    <Suspense fallback={null}>
      <DatasetsPublicosContent />
    </Suspense>
  )
}
