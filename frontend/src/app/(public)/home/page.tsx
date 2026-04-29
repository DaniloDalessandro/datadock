"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Database, Download, Search, RefreshCw, ExternalLink,
  Calendar, Hash, Columns3, FileDown, ChevronRight,
  BarChart2, Layers, Menu, X, Loader2, FileText,
  FileSpreadsheet, FileCode, Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface ExtendedDataset extends PublicDataset {
  description?: string
  fileType?: "CSV" | "XLSX" | "JSON"
  fileSize?: string
  downloadPath?: string
}

interface ColumnMetadata {
  name: string
  type: string
  filter_type: string
  unique_values: string[]
}

type FileTypeFilter = "all" | "CSV" | "XLSX" | "JSON"

// ─── Mock datasets (fallback when API returns empty) ─────────────────────────

const MOCK_DATASETS: ExtendedDataset[] = [
  {
    id: -1,
    table_name: "Operações Portuárias",
    description: "Registros completos das operações realizadas no porto, incluindo movimentações, cargas e descargas.",
    fileType: "CSV",
    fileSize: "45 MB",
    record_count: 1247890,
    created_at: "2025-04-15",
    updated_at: "2025-04-15",
    status: "active",
    status_display: "Ativo",
    column_structure: {},
    downloadPath: "/datasets/operacoes-portuarias.csv",
  },
  {
    id: -2,
    table_name: "Atracações",
    description: "Dados sobre todas as atracações de embarcações, com horários, berços e duração.",
    fileType: "CSV",
    fileSize: "28 MB",
    record_count: 384521,
    created_at: "2025-04-10",
    updated_at: "2025-04-10",
    status: "active",
    status_display: "Ativo",
    column_structure: {},
    downloadPath: "/datasets/atracacoes.csv",
  },
  {
    id: -3,
    table_name: "Mercadorias",
    description: "Catálogo de mercadorias movimentadas, com tipos, volumes e origens/destinos.",
    fileType: "XLSX",
    fileSize: "12 MB",
    record_count: 892340,
    created_at: "2025-03-28",
    updated_at: "2025-03-28",
    status: "active",
    status_display: "Ativo",
    column_structure: {},
    downloadPath: "/datasets/mercadorias.xlsx",
  },
  {
    id: -4,
    table_name: "Veículos",
    description: "Registro de veículos que passaram pelo terminal, com tipo, placa e datas de entrada/saída.",
    fileType: "CSV",
    fileSize: "8 MB",
    record_count: 215678,
    created_at: "2025-04-01",
    updated_at: "2025-04-01",
    status: "active",
    status_display: "Ativo",
    column_structure: {},
    downloadPath: "/datasets/veiculos.csv",
  },
  {
    id: -5,
    table_name: "Paradas Operacionais",
    description: "Histórico de paradas e interrupções operacionais com causas, durações e impactos.",
    fileType: "JSON",
    fileSize: "3 MB",
    record_count: 45230,
    created_at: "2025-03-15",
    updated_at: "2025-03-15",
    status: "active",
    status_display: "Ativo",
    column_structure: {},
    downloadPath: "/datasets/paradas-operacionais.json",
  },
  {
    id: -6,
    table_name: "Produtividade por Navio",
    description: "Métricas de produtividade por embarcação, incluindo tempo de espera, operação e saída.",
    fileType: "XLSX",
    fileSize: "18 MB",
    record_count: 127450,
    created_at: "2025-04-05",
    updated_at: "2025-04-05",
    status: "active",
    status_display: "Ativo",
    column_structure: {},
    downloadPath: "/datasets/produtividade-por-navio.xlsx",
  },
]

// ─── Helper: enrich API datasets with inferred extra fields ──────────────────

function enrichDataset(d: PublicDataset): ExtendedDataset {
  return {
    ...d,
    fileType: "CSV",
    description: `Dataset contendo dados de ${d.table_name.replace(/_/g, " ")}.`,
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FileTypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    CSV:  { bg: "rgba(255,56,92,0.08)",  color: "#e00b41"  },
    XLSX: { bg: "rgba(39,166,68,0.08)",  color: "#1a8035"  },
    JSON: { bg: "rgba(59,130,246,0.10)", color: "#2563eb"  },
  }
  const style = map[type] ?? { bg: "#f7f7f7", color: "#6a6a6a" }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none"
      style={{ background: style.bg, color: style.color }}
    >
      {type}
    </span>
  )
}

function FileTypeIcon({ type, className = "h-5 w-5" }: { type: string; className?: string }) {
  if (type === "XLSX") return <FileSpreadsheet className={className} style={{ color: "#1a8035" }} />
  if (type === "JSON") return <FileCode className={className} style={{ color: "#2563eb" }} />
  return <FileText className={className} style={{ color: "#e00b41" }} />
}

function FileTypeIconBg({ type }: { type: string }) {
  const bgMap: Record<string, string> = {
    CSV:  "rgba(255,56,92,0.08)",
    XLSX: "rgba(39,166,68,0.08)",
    JSON: "rgba(59,130,246,0.10)",
  }
  const borderMap: Record<string, string> = {
    CSV:  "rgba(255,56,92,0.15)",
    XLSX: "rgba(39,166,68,0.15)",
    JSON: "rgba(59,130,246,0.20)",
  }
  return (
    <div
      className="p-2.5 rounded-[8px] flex-shrink-0"
      style={{
        background: bgMap[type] ?? "#f7f7f7",
        border: `1px solid ${borderMap[type] ?? "#dddddd"}`,
      }}
    >
      <FileTypeIcon type={type} />
    </div>
  )
}

interface DatasetCardProps {
  dataset: ExtendedDataset
  onExplore?: (dataset: ExtendedDataset) => void
  onDownload: (dataset: ExtendedDataset, format: string) => void
}

function DatasetCard({ dataset, onExplore, onDownload }: DatasetCardProps) {
  const fileType = dataset.fileType ?? "CSV"
  const isMock = dataset.id < 0
  const updatedAt = dataset.updated_at ?? dataset.created_at
  const formattedDate = new Date(updatedAt).toLocaleDateString("pt-BR")
  const formattedCount = dataset.record_count.toLocaleString("pt-BR")

  return (
    <article
      className="group flex flex-col bg-white rounded-[14px] border border-[#dddddd] p-6 transition-all duration-200 dark:bg-[#191a1b] dark:border-[rgba(255,255,255,0.08)]"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px"
        e.currentTarget.style.borderColor = "#c1c1c1"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none"
        e.currentTarget.style.borderColor = "#dddddd"
      }}
    >
      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between mb-4">
        <FileTypeIconBg type={fileType} />
        <FileTypeBadge type={fileType} />
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-semibold leading-snug mb-2 text-[#222222] dark:text-[#f7f8f8] group-hover:text-[#ff385c] transition-colors duration-150">
        {dataset.table_name}
      </h3>

      {/* Description */}
      {dataset.description && (
        <p className="text-[13px] leading-relaxed text-[#6a6a6a] dark:text-[#8a8f98] line-clamp-2 mb-4 flex-1">
          {dataset.description}
        </p>
      )}

      {/* Meta row: count + date */}
      <div className="flex items-center gap-4 py-3 border-t border-b border-[#ebebeb] dark:border-[rgba(255,255,255,0.06)] mb-4">
        <div className="flex items-center gap-1.5 text-xs text-[#6a6a6a] dark:text-[#8a8f98]">
          <Hash className="h-3.5 w-3.5 flex-shrink-0 text-[#929292]" />
          <span>
            <span className="font-semibold text-[#3f3f3f] dark:text-[#d0d6e0]">{formattedCount}</span>
            {" "}registros
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6a6a6a] dark:text-[#8a8f98]">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-[#929292]" />
          <span>Atualizado em {formattedDate}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        {isMock && dataset.downloadPath ? (
          <a
            href={dataset.downloadPath}
            download
            className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-[8px] text-sm font-medium text-white transition-colors duration-150"
            style={{ background: "#ff385c" }}
            aria-label={`Baixar ${dataset.table_name} em ${fileType}`}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e00b41" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#ff385c" }}
          >
            <Download className="h-4 w-4" />
            Baixar dataset
          </a>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-[8px] text-sm font-medium text-white transition-colors duration-150"
                style={{ background: "#ff385c" }}
                aria-label={`Baixar ${dataset.table_name} em ${fileType}`}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#e00b41" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ff385c" }}
              >
                <Download className="h-4 w-4" />
                Baixar dataset
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {["csv", "xlsx", "json"].map((fmt) => (
                <DropdownMenuItem
                  key={fmt}
                  onClick={() => onDownload(dataset, fmt)}
                  className="text-sm"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  {fmt === "xlsx" ? "Excel (xlsx)" : fmt.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onExplore && !isMock && (
          <button
            className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-[8px] text-sm font-medium text-[#222222] dark:text-[#f7f8f8] border border-[#dddddd] dark:border-[rgba(255,255,255,0.12)] bg-white dark:bg-[#0f1011] transition-colors duration-150 hover:bg-[#f7f7f7] dark:hover:bg-[#191a1b]"
            onClick={() => onExplore(dataset)}
            aria-label={`Explorar dataset ${dataset.table_name}`}
          >
            <ChevronRight className="h-4 w-4" />
            Explorar
          </button>
        )}
      </div>
    </article>
  )
}

interface DatasetGridProps {
  datasets: ExtendedDataset[]
  isLoading: boolean
  search: string
  onExplore: (dataset: ExtendedDataset) => void
  onDownload: (dataset: ExtendedDataset, format: string) => void
}

function DatasetGrid({ datasets, isLoading, search, onExplore, onDownload }: DatasetGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-6 rounded-[14px] bg-white dark:bg-[#191a1b] border border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-10 w-10 rounded-[8px] bg-[#f2f2f2] dark:bg-[#1f2023]" />
              <Skeleton className="h-5 w-12 rounded-full bg-[#f2f2f2] dark:bg-[#1f2023]" />
            </div>
            <Skeleton className="h-4 w-3/4 mb-2 bg-[#f2f2f2] dark:bg-[#1f2023]" />
            <Skeleton className="h-3 w-full mb-1.5 bg-[#ebebeb] dark:bg-[#1f2023]" />
            <Skeleton className="h-3 w-4/5 mb-4 bg-[#ebebeb] dark:bg-[#1f2023]" />
            <Skeleton className="h-10 w-full rounded-[8px] bg-[#ebebeb] dark:bg-[#1f2023]" />
          </div>
        ))}
      </div>
    )
  }

  if (datasets.length === 0) {
    return (
      <div className="text-center py-20">
        <Database className="h-12 w-12 mx-auto mb-4 text-[#c1c1c1]" />
        <p className="text-base font-semibold text-[#6a6a6a] dark:text-[#8a8f98]">
          Nenhum dataset encontrado
        </p>
        <p className="text-sm mt-1.5 text-[#929292]">
          {search
            ? `Sem resultados para "${search}"`
            : "Nenhum dataset público disponível"}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {datasets.map((dataset) => (
        <DatasetCard
          key={dataset.id}
          dataset={dataset}
          onExplore={dataset.id > 0 ? onExplore : undefined}
          onDownload={onDownload}
        />
      ))}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const [datasets, setDatasets] = useState<PublicDataset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeFileType, setActiveFileType] = useState<FileTypeFilter>("all")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Explorer state
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [explorerDataset, setExplorerDataset] = useState<PublicDataset | null>(null)
  const [explorerLoading, setExplorerLoading] = useState(false)
  const [explorerColumns, setExplorerColumns] = useState<ColumnMetadata[]>([])
  const [explorerData, setExplorerData] = useState<Record<string, unknown>[]>([])
  const [explorerSearch, setExplorerSearch] = useState("")
  const [explorerPage, setExplorerPage] = useState(1)
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue>>({})
  const ROWS_PER_PAGE = 50

  // ── Data fetching ───────────────────────────────────────────────────────────

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
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current) }
  }, [fetchDatasets])

  // ── Explorer handlers ───────────────────────────────────────────────────────

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

  const handleDownload = async (dataset: ExtendedDataset, format: string) => {
    if (dataset.id < 0 && dataset.downloadPath) {
      // Static file download for mock datasets
      const a = document.createElement("a")
      a.href = dataset.downloadPath
      a.download = `${dataset.table_name}.${format}`
      a.click()
      return
    }
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
    const blob = new Blob([JSON.stringify(explorerFiltered, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${explorerDataset.table_name}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("JSON baixado!")
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  const explorerFiltered = useMemo(() => {
    let result = explorerData
    if (explorerSearch.trim()) {
      const kw = explorerSearch.toLowerCase()
      result = result.filter((row) =>
        Object.values(row).some(
          (v) => v !== null && v !== undefined && String(v).toLowerCase().includes(kw)
        )
      )
    }
    if (Object.keys(activeFilters).length === 0) return result
    return result.filter((row) =>
      Object.entries(activeFilters).every(([col, filter]) => {
        if (!filter) return true
        const cell = row[col]
        const str =
          cell !== null && cell !== undefined ? String(cell).toLowerCase() : ""
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
            return filter.value === "all"
              ? true
              : String(cell).toLowerCase() === (filter.value as string)
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

  // Use API data if available, fallback to mock
  const displayDatasets: ExtendedDataset[] = useMemo(() => {
    const base =
      datasets.length > 0
        ? datasets.map(enrichDataset)
        : MOCK_DATASETS

    const afterSearch = search.trim()
      ? base.filter((d) =>
          d.table_name.toLowerCase().includes(search.toLowerCase())
        )
      : base

    const afterType =
      activeFileType === "all"
        ? afterSearch
        : afterSearch.filter((d) => (d.fileType ?? "CSV") === activeFileType)

    return afterType
  }, [datasets, search, activeFileType])

  // Stats computed from the current base (before search/type filter)
  const baseDatasets: ExtendedDataset[] = useMemo(
    () => (datasets.length > 0 ? datasets.map(enrichDataset) : MOCK_DATASETS),
    [datasets]
  )
  const displayTotalRecords = useMemo(
    () => baseDatasets.reduce((acc, d) => acc + (d.record_count || 0), 0),
    [baseDatasets]
  )

  const explorerPageCount = Math.max(
    1,
    Math.ceil(explorerFiltered.length / ROWS_PER_PAGE)
  )
  const explorerPageData = explorerFiltered.slice(
    (explorerPage - 1) * ROWS_PER_PAGE,
    explorerPage * ROWS_PER_PAGE
  )

  function formatLargeNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return n.toLocaleString("pt-BR")
  }

  const FILE_TYPE_TABS: { value: FileTypeFilter; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "CSV", label: "CSV" },
    { value: "XLSX", label: "XLSX" },
    { value: "JSON", label: "JSON" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f1011]">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 bg-white dark:bg-[#0f1011] border-b border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]"
        style={{ height: "80px" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 rounded-[8px]"
                style={{
                  background: "rgba(255,56,92,0.10)",
                  border: "1px solid rgba(255,56,92,0.18)",
                }}
              >
                <Database className="h-4 w-4" style={{ color: "#ff385c" }} />
              </div>
              <span className="font-semibold text-base text-[#222222] dark:text-[#f7f8f8]">
                DataDock
              </span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/home"
                className="px-3 py-1.5 text-sm font-semibold rounded-[8px] text-[#222222] dark:text-[#f7f8f8] bg-[#f7f7f7] dark:bg-[rgba(255,255,255,0.06)]"
              >
                Início
              </Link>
              <Link
                href="/datasets-publicos"
                className="px-3 py-1.5 text-sm rounded-[8px] transition-colors text-[#6a6a6a] dark:text-[#8a8f98] hover:text-[#222222] dark:hover:text-[#f7f8f8] hover:bg-[#f7f7f7] dark:hover:bg-[rgba(255,255,255,0.06)]"
              >
                Datasets
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-sm rounded-[8px] transition-colors flex items-center gap-1 text-[#6a6a6a] dark:text-[#8a8f98] hover:text-[#222222] dark:hover:text-[#f7f8f8] hover:bg-[#f7f7f7] dark:hover:bg-[rgba(255,255,255,0.06)]"
              >
                Portal Interno
                <ExternalLink className="h-3 w-3" />
              </Link>
            </nav>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-[8px] transition-colors text-[#6a6a6a] dark:text-[#8a8f98] hover:text-[#222222] dark:hover:text-[#f7f8f8] hover:bg-[#f7f7f7] dark:hover:bg-[rgba(255,255,255,0.06)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen
                ? <X className="h-5 w-5" />
                : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2 px-4 flex flex-col gap-1 border-t border-[#dddddd] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0f1011]">
            <Link
              href="/home"
              className="py-2 text-sm font-semibold text-[#222222] dark:text-[#f7f8f8]"
            >
              Início
            </Link>
            <Link
              href="/datasets-publicos"
              className="py-2 text-sm text-[#6a6a6a] dark:text-[#8a8f98]"
            >
              Datasets
            </Link>
            <Link
              href="/dashboard"
              className="py-2 text-sm flex items-center gap-1 text-[#6a6a6a] dark:text-[#8a8f98]"
            >
              Portal Interno <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#f7f7f7] dark:bg-[#191a1b] border-b border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {/* Badge */}
          <div className="mb-5">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(255,56,92,0.10)",
                color: "#ff385c",
                border: "1px solid rgba(255,56,92,0.18)",
              }}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Portal de Dados Abertos
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[40px] sm:text-[48px] font-bold leading-tight tracking-tight text-[#222222] dark:text-[#f7f8f8] mb-3">
            Datasets disponíveis
          </h1>
          <p className="text-base sm:text-lg text-[#6a6a6a] dark:text-[#8a8f98] max-w-[600px] mb-8">
            Baixe bases de dados públicas e estruturadas para análises, estudos e
            desenvolvimento de soluções.
          </p>

          {/* Search bar */}
          <div className="relative max-w-[480px] mb-8">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#929292]"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Buscar datasets..."
              aria-label="Buscar datasets"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-5 rounded-full border border-[#dddddd] dark:border-[rgba(255,255,255,0.12)] bg-white dark:bg-[#0f1011] text-[#222222] dark:text-[#f7f8f8] placeholder:text-[#929292] text-sm outline-none focus:border-[#222222] dark:focus:border-[rgba(255,255,255,0.3)] transition-colors duration-150"
              style={{
                boxShadow:
                  "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.06) 0 4px 8px",
              }}
            />
          </div>

          {/* Hero stats */}
          <div className="flex flex-wrap gap-6">
            {isLoading ? (
              <>
                <Skeleton className="h-12 w-36 bg-[#ebebeb] dark:bg-[#1f2023] rounded-lg" />
                <Skeleton className="h-12 w-36 bg-[#ebebeb] dark:bg-[#1f2023] rounded-lg" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-[8px]"
                    style={{
                      background: "rgba(255,56,92,0.08)",
                      border: "1px solid rgba(255,56,92,0.15)",
                    }}
                  >
                    <Layers className="h-5 w-5" style={{ color: "#ff385c" }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#222222] dark:text-[#f7f8f8]">
                      {baseDatasets.length}
                    </p>
                    <p className="text-xs text-[#929292]">Datasets disponíveis</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-[8px]"
                    style={{
                      background: "rgba(39,166,68,0.08)",
                      border: "1px solid rgba(39,166,68,0.15)",
                    }}
                  >
                    <FileText className="h-5 w-5" style={{ color: "#27a644" }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#222222] dark:text-[#f7f8f8]">
                      {formatLargeNumber(
                        datasets.length > 0 ? totalRecords : displayTotalRecords
                      )}
                    </p>
                    <p className="text-xs text-[#929292]">Total de registros</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0f1011] border-b border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-[#dddddd] dark:divide-[rgba(255,255,255,0.08)]">
            {/* Stat 1 */}
            <div className="flex flex-col items-center justify-center gap-0.5 py-5 px-4">
              <span className="text-xl sm:text-2xl font-bold text-[#222222] dark:text-[#f7f8f8]">
                {isLoading ? "—" : baseDatasets.length}
              </span>
              <span className="text-xs sm:text-sm text-[#6a6a6a] dark:text-[#8a8f98] text-center">
                Datasets disponíveis
              </span>
            </div>
            {/* Stat 2 */}
            <div className="flex flex-col items-center justify-center gap-0.5 py-5 px-4">
              <span className="text-xl sm:text-2xl font-bold text-[#222222] dark:text-[#f7f8f8]">
                {isLoading
                  ? "—"
                  : formatLargeNumber(
                      datasets.length > 0 ? totalRecords : displayTotalRecords
                    )}
              </span>
              <span className="text-xs sm:text-sm text-[#6a6a6a] dark:text-[#8a8f98] text-center">
                Registros totais
              </span>
            </div>
            {/* Stat 3 */}
            <div className="flex flex-col items-center justify-center gap-0.5 py-5 px-4">
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#27a644" }} />
                <span className="text-xl sm:text-2xl font-bold text-[#222222] dark:text-[#f7f8f8]">
                  Livre
                </span>
              </div>
              <span className="text-xs sm:text-sm text-[#6a6a6a] dark:text-[#8a8f98] text-center">
                Sem cadastro
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Catalog ────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 w-full">
        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          {/* File type pills */}
          <div
            className="flex items-center gap-2 flex-wrap"
            role="tablist"
            aria-label="Filtrar por tipo de arquivo"
          >
            {FILE_TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={activeFileType === tab.value}
                onClick={() => setActiveFileType(tab.value)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150"
                style={
                  activeFileType === tab.value
                    ? { background: "#ff385c", color: "#ffffff" }
                    : {
                        background: "#f7f7f7",
                        color: "#6a6a6a",
                        border: "1px solid #ebebeb",
                      }
                }
                onMouseEnter={(e) => {
                  if (activeFileType !== tab.value) {
                    e.currentTarget.style.background = "#ebebeb"
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFileType !== tab.value) {
                    e.currentTarget.style.background = "#f7f7f7"
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right controls: count label + refresh */}
          <div className="flex items-center gap-3">
            {!isLoading && (
              <span className="text-sm text-[#929292]">
                {displayDatasets.length}{" "}
                {displayDatasets.length === 1 ? "dataset" : "datasets"}
              </span>
            )}
            <button
              onClick={fetchDatasets}
              title="Atualizar"
              className="h-9 w-9 flex items-center justify-center rounded-[8px] border border-[#dddddd] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0f1011] text-[#6a6a6a] dark:text-[#8a8f98] hover:bg-[#f7f7f7] dark:hover:bg-[#191a1b] transition-colors"
              aria-label="Atualizar lista de datasets"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Grid */}
        <DatasetGrid
          datasets={displayDatasets}
          isLoading={isLoading}
          search={search}
          onExplore={openExplorer}
          onDownload={handleDownload}
        />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-[#dddddd] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0f1011]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="p-1 rounded-[4px]"
              style={{ background: "rgba(255,56,92,0.08)" }}
            >
              <Database className="h-3.5 w-3.5" style={{ color: "#ff385c" }} />
            </div>
            <span className="text-sm font-semibold text-[#222222] dark:text-[#f7f8f8]">
              DataDock
            </span>
            <span className="text-sm text-[#929292]">— Portal de Dados Portuários</span>
          </div>
          <p className="text-xs text-[#929292]">
            Dados atualizados automaticamente a cada 60 segundos
          </p>
        </div>
      </footer>

      {/* ── Data Explorer Sheet ─────────────────────────────────────────────── */}
      <Sheet open={explorerOpen} onOpenChange={setExplorerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-none sm:w-[90vw] lg:w-[80vw] p-0 flex flex-col bg-white dark:bg-[#0f1011] border-l border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]"
        >
          <SheetHeader className="flex-shrink-0 px-6 py-4 bg-[#f7f7f7] dark:bg-[#191a1b] border-b border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-[8px]"
                  style={{ background: "rgba(255,56,92,0.08)" }}
                >
                  <Database className="h-5 w-5" style={{ color: "#ff385c" }} />
                </div>
                <div>
                  <SheetTitle className="text-base font-semibold text-[#222222] dark:text-[#f7f8f8]">
                    {explorerDataset?.table_name}
                  </SheetTitle>
                  {explorerDataset && (
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-[#929292]">
                        <Hash className="h-3 w-3" />
                        {explorerDataset.record_count.toLocaleString("pt-BR")} registros
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#929292]">
                        <Columns3 className="h-3 w-3" />
                        {Object.keys(explorerDataset.column_structure || {}).length} colunas
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#929292]">
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
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                      <Download className="h-3.5 w-3.5" />Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {["csv", "xlsx"].map((fmt) => (
                      <DropdownMenuItem
                        key={fmt}
                        onClick={() =>
                          handleDownload(
                            enrichDataset(explorerDataset),
                            fmt
                          )
                        }
                        className="text-sm"
                      >
                        <Download className="h-3.5 w-3.5 mr-2" />
                        {fmt === "xlsx" ? "Excel (xlsx)" : fmt.toUpperCase()}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      onClick={handleExplorerDownloadJson}
                      className="text-sm"
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />JSON (filtrado)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </SheetHeader>

          <div className="flex-shrink-0 px-6 py-3 flex items-center gap-2 flex-wrap border-b border-[#dddddd] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0f1011]">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#929292]" />
              <Input
                placeholder="Buscar em todas as colunas..."
                className="pl-8 h-9 text-sm"
                value={explorerSearch}
                onChange={(e) => {
                  setExplorerSearch(e.target.value)
                  setExplorerPage(1)
                }}
              />
            </div>
            {Object.keys(activeFilters).length > 0 && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{
                  color: "#ff385c",
                  background: "rgba(255,56,92,0.08)",
                  border: "1px solid rgba(255,56,92,0.20)",
                }}
              >
                {Object.keys(activeFilters).length} filtro
                {Object.keys(activeFilters).length !== 1 ? "s" : ""} ativo
                {Object.keys(activeFilters).length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-white dark:bg-[#0f1011]">
            {explorerLoading ? (
              <div className="flex items-center justify-center h-64 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#ff385c]" />
                <span className="text-[#6a6a6a] dark:text-[#8a8f98]">
                  Carregando dados...
                </span>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="py-2.5 px-4 text-xs border-0 w-12">#</TableHead>
                    {explorerColumns.map((col) => (
                      <TableHead
                        key={col.name}
                        className="py-2.5 px-4 text-xs border-0 min-w-[140px]"
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
                        className="text-center py-16 border-0 text-[#6a6a6a] dark:text-[#8a8f98]"
                      >
                        Nenhum registro encontrado com os filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    explorerPageData.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className="border-0 transition-colors duration-100"
                      >
                        <TableCell className="py-2 px-4 text-xs border-0 font-mono text-[#929292]">
                          {(explorerPage - 1) * ROWS_PER_PAGE + idx + 1}
                        </TableCell>
                        {explorerColumns.map((col) => (
                          <TableCell
                            key={col.name}
                            className="py-2 px-4 text-sm border-0"
                          >
                            {row[col.name] !== null &&
                            row[col.name] !== undefined ? (
                              String(row[col.name])
                            ) : (
                              <span className="text-[#929292]">—</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {!explorerLoading && explorerFiltered.length > 0 && (
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 text-sm border-t border-[#dddddd] dark:border-[rgba(255,255,255,0.08)] bg-[#f7f7f7] dark:bg-[#191a1b] text-[#6a6a6a] dark:text-[#8a8f98]">
              <span>
                Mostrando{" "}
                <span className="text-[#222222] dark:text-[#f7f8f8] font-medium">
                  {(explorerPage - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(
                    explorerPage * ROWS_PER_PAGE,
                    explorerFiltered.length
                  )}
                </span>{" "}
                de{" "}
                <span className="text-[#222222] dark:text-[#f7f8f8] font-medium">
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
                <span className="text-xs text-[#929292]">
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
