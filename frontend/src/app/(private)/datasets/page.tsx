"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import {
  Search, Plus, Database, Eye, RefreshCw, MoreHorizontal,
  Hash, Columns3, Calendar, Filter, Loader2, Archive,
  LayoutGrid, List,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { useDatasets, type Dataset } from "@/hooks/useDatasets"
import { toast } from "sonner"

const DatasetDialog = lazy(() => import("@/components/datasets/DatasetDialog"))

type StatusFilter = "all" | "active" | "inactive" | "processing" | "pending"
type ViewMode = "table" | "grid"

function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-4 px-4"
      style={{
        height: "52px",
        borderBottom: "1px solid #ebebeb",
        background: "#ffffff",
      }}
    >
      <div className="w-5 h-5 rounded flex-shrink-0" style={{ background: "#f2f2f2" }} />
      <div className="flex-1 min-w-0">
        <div className="h-3.5 rounded w-48" style={{ background: "#f2f2f2" }} />
      </div>
      <div className="h-5 rounded-full w-16 flex-shrink-0" style={{ background: "#f2f2f2" }} />
      <div className="h-3.5 rounded w-20 flex-shrink-0" style={{ background: "#f2f2f2" }} />
      <div className="h-3.5 rounded w-16 flex-shrink-0" style={{ background: "#f2f2f2" }} />
      <div className="h-3.5 rounded w-20 flex-shrink-0" style={{ background: "#f2f2f2" }} />
      <div className="h-7 rounded w-7 flex-shrink-0" style={{ background: "#f2f2f2" }} />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #dddddd",
      borderRadius: "14px",
      padding: "1.25rem",
    }}>
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-lg" style={{ background: "#f2f2f2" }} />
        <div className="h-5 w-16 rounded-full" style={{ background: "#f2f2f2" }} />
      </div>
      <div className="h-4 w-3/4 rounded mb-3" style={{ background: "#f2f2f2" }} />
      <div className="space-y-2 mb-4">
        <div className="h-3.5 w-1/2 rounded" style={{ background: "#f2f2f2" }} />
        <div className="h-3.5 w-2/5 rounded" style={{ background: "#f2f2f2" }} />
        <div className="h-3.5 w-1/3 rounded" style={{ background: "#f2f2f2" }} />
      </div>
      <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid #ebebeb" }}>
        <div className="h-8 flex-1 rounded-md" style={{ background: "#f2f2f2" }} />
        <div className="h-8 w-8 rounded-md" style={{ background: "#f2f2f2" }} />
      </div>
    </div>
  )
}

function exportDatasetsCsv(datasets: Dataset[]) {
  const headers = ["ID", "Nome", "Status", "Registros", "Colunas", "Atualizado"]
  const rows = datasets.map((d) => [
    d.id, `"${d.table_name}"`, d.status_display || d.status, d.record_count,
    Object.keys(d.column_structure || {}).length,
    new Date(d.updated_at).toLocaleDateString("pt-BR"),
  ])
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "datasets.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function DatasetsPage() {
  const { datasets, isLoading, createDataset, fetchDatasets } = useDatasets()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  const handleRefresh = async (silent = false) => {
    setIsRefreshing(true)
    await fetchDatasets()
    setIsRefreshing(false)
    if (!silent) toast.success("Lista atualizada!")
  }

  useEffect(() => {
    const id = setInterval(() => { fetchDatasets() }, 30000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateDataset = async (data: {
    import_type: "endpoint" | "file"; table_name: string; endpoint_url?: string; file?: File
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
    <div className="flex flex-col min-h-screen" style={{ background: "#ffffff" }}>

      {/* ── Page header ── */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "24px 32px 0" }}
      >
        <div>
          <h1
            className="leading-none"
            style={{
              fontSize: "24px",
              fontWeight: 510,
              letterSpacing: "-0.288px",
              color: "#222222",
            }}
          >
            Datasets
          </h1>
          <p className="mt-1" style={{ fontSize: "13px", color: "#6a6a6a" }}>
            {isLoading ? "Carregando..." : `${datasets.length} dataset${datasets.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          style={{
            background: "#ff385c",
            color: "#fff",
            borderRadius: "8px",
            border: "none",
            fontSize: "13px",
            fontWeight: 510,
            padding: "8px 16px",
            height: "auto",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "background 150ms",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#e00b41")}
          onMouseLeave={e => (e.currentTarget.style.background = "#ff385c")}
        >
          <Plus style={{ width: "14px", height: "14px" }} />
          Novo Dataset
        </Button>
      </div>

      {/* ── Filter bar ── */}
      <div
        className="flex flex-wrap items-center gap-2"
        style={{
          padding: "16px 32px",
          borderBottom: "1px solid #ebebeb",
        }}
      >
        {/* Search */}
        <div className="relative" style={{ width: "300px" }}>
          <Search
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "14px",
              height: "14px",
              color: "#929292",
              pointerEvents: "none",
            }}
          />
          <Input
            placeholder="Buscar dataset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: "32px",
              height: "34px",
              fontSize: "13px",
              background: "#ffffff",
              border: "1px solid #dddddd",
              borderRadius: "8px",
              color: "#222222",
            }}
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger
            style={{
              height: "34px",
              fontSize: "13px",
              background: "#ffffff",
              border: "1px solid #dddddd",
              borderRadius: "8px",
              color: "#3f3f3f",
              width: "180px",
            }}
          >
            <Filter style={{ width: "13px", height: "13px", color: "#929292", marginRight: "6px" }} />
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

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          style={{
            height: "34px",
            fontSize: "13px",
            background: "#ffffff",
            border: "1px solid #dddddd",
            borderRadius: "8px",
            color: "#3f3f3f",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "0 12px",
          }}
        >
          <RefreshCw
            style={{
              width: "13px",
              height: "13px",
              animation: isRefreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          Atualizar
        </Button>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => { setSearchTerm(""); setStatusFilter("all") }}
            style={{
              fontSize: "12px",
              color: "#c13515",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 4px",
              textDecoration: "underline",
            }}
          >
            Limpar filtros
          </button>
        )}

        {/* Result count when filtered */}
        {hasFilters && !isLoading && (
          <span className="ml-auto" style={{ fontSize: "12px", color: "#929292" }}>
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        )}

        {/* View toggle */}
        <div
          className="flex items-center ml-auto gap-0.5"
          style={{
            background: "#f7f7f7",
            border: "1px solid #dddddd",
            borderRadius: "8px",
            padding: "2px",
          }}
        >
          <button
            onClick={() => setViewMode("table")}
            title="Visualização em tabela"
            style={{
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              background: viewMode === "table" ? "#ffffff" : "transparent",
              color: viewMode === "table" ? "#222222" : "#929292",
              transition: "all 150ms",
              boxShadow: viewMode === "table" ? "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px" : "none",
            }}
          >
            <List style={{ width: "14px", height: "14px" }} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            title="Visualização em grade"
            style={{
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              background: viewMode === "grid" ? "#ffffff" : "transparent",
              color: viewMode === "grid" ? "#222222" : "#929292",
              transition: "all 150ms",
              boxShadow: viewMode === "grid" ? "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px" : "none",
            }}
          >
            <LayoutGrid style={{ width: "14px", height: "14px" }} />
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ padding: "0 32px 32px", marginTop: "24px" }}>

        {/* Loading state */}
        {isLoading ? (
          viewMode === "table" ? (
            <div style={{
              background: "#ffffff",
              border: "1px solid #dddddd",
              borderRadius: "14px",
              overflow: "hidden",
            }}>
              {/* Table header skeleton */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 120px 100px 120px 40px",
                  padding: "10px 16px",
                  background: "#f7f7f7",
                  borderBottom: "1px solid #ebebeb",
                  gap: "16px",
                }}
              >
                {["Nome", "Status", "Registros", "Colunas", "Atualizado", ""].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: "11px",
                      fontWeight: 510,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#929292",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )

        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center text-center" style={{ padding: "80px 24px" }}>
            <div
              style={{
                background: "rgba(255,56,92,0.06)",
                borderRadius: "14px",
                padding: "12px",
                marginBottom: "16px",
                display: "inline-flex",
              }}
            >
              <Database style={{ width: "40px", height: "40px", color: "#ff385c" }} />
            </div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 590,
                color: "#222222",
                marginBottom: "8px",
              }}
            >
              Nenhum dataset encontrado
            </h3>
            <p style={{ fontSize: "14px", color: "#6a6a6a", maxWidth: "320px", marginBottom: "24px" }}>
              {hasFilters
                ? "Tente ajustar os filtros de busca para encontrar o que procura"
                : "Comece adicionando seu primeiro dataset ao sistema"}
            </p>
            {!hasFilters && (
              <Button
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                style={{
                  background: "#ff385c",
                  color: "#fff",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 510,
                  padding: "8px 16px",
                  height: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "background 150ms",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#e00b41")}
                onMouseLeave={e => (e.currentTarget.style.background = "#ff385c")}
              >
                <Plus style={{ width: "14px", height: "14px" }} />
                Criar primeiro dataset
              </Button>
            )}
          </div>

        ) : viewMode === "table" ? (
          /* ── Table view ── */
          <div style={{
            background: "#ffffff",
            border: "1px solid #dddddd",
            borderRadius: "14px",
            overflow: "hidden",
          }}>
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 120px 100px 120px 40px",
                alignItems: "center",
                padding: "10px 16px",
                background: "#f7f7f7",
                borderBottom: "1px solid #ebebeb",
                gap: "16px",
              }}
            >
              {[
                { label: "Nome" },
                { label: "Status" },
                { label: "Registros" },
                { label: "Colunas" },
                { label: "Atualizado" },
                { label: "" },
              ].map(({ label }) => (
                <span
                  key={label}
                  style={{
                    fontSize: "11px",
                    fontWeight: 510,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.05em",
                    color: "#929292",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Table rows */}
            {filtered.map((dataset) => (
              <div
                key={dataset.id}
                onMouseEnter={() => setHoveredRow(dataset.id)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 120px 100px 120px 40px",
                  alignItems: "center",
                  padding: "0 16px",
                  height: "52px",
                  borderBottom: "1px solid #ebebeb",
                  background: hoveredRow === dataset.id ? "#f7f7f7" : "#ffffff",
                  transition: "background 150ms",
                  cursor: "pointer",
                  gap: "16px",
                }}
                onClick={() => window.open(`/datasets/${dataset.id}`, "_blank")}
              >
                {/* Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: "rgba(255,56,92,0.06)",
                      border: "1px solid rgba(255,56,92,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Database style={{ width: "13px", height: "13px", color: "#ff385c" }} />
                  </div>
                  <span
                    className="truncate"
                    style={{
                      fontSize: "13px",
                      fontWeight: 510,
                      color: hoveredRow === dataset.id ? "#ff385c" : "#222222",
                      transition: "color 150ms",
                    }}
                  >
                    {dataset.table_name}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={dataset.status}>{dataset.status_display}</StatusBadge>
                </div>

                {/* Records */}
                <div className="flex items-center gap-1.5">
                  <Hash style={{ width: "12px", height: "12px", color: "#929292", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "#3f3f3f" }}>
                    {dataset.record_count.toLocaleString("pt-BR")}
                  </span>
                </div>

                {/* Columns */}
                <div className="flex items-center gap-1.5">
                  <Columns3 style={{ width: "12px", height: "12px", color: "#929292", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "#3f3f3f" }}>
                    {Object.keys(dataset.column_structure || {}).length}
                  </span>
                </div>

                {/* Updated */}
                <div className="flex items-center gap-1.5">
                  <Calendar style={{ width: "12px", height: "12px", color: "#929292", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "#3f3f3f" }}>
                    {new Date(dataset.updated_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center justify-end"
                  style={{ opacity: hoveredRow === dataset.id ? 1 : 0, transition: "opacity 150ms" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        style={{
                          width: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "6px",
                          border: "1px solid #dddddd",
                          background: "#f7f7f7",
                          cursor: "pointer",
                          color: "#6a6a6a",
                        }}
                      >
                        <MoreHorizontal style={{ width: "14px", height: "14px" }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuLabel className="text-xs" style={{ color: "#929292" }}>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-xs cursor-pointer"
                        onClick={() => window.open(`/datasets/${dataset.id}`, "_blank")}
                      >
                        <Eye className="h-3.5 w-3.5 mr-2" />
                        Abrir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-xs cursor-pointer"
                        style={{ color: "#f59e0b" }}
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

            {/* Pagination info footer */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #ebebeb",
              }}
            >
              <span style={{ fontSize: "12px", color: "#929292" }}>
                {hasFilters
                  ? `${filtered.length} de ${datasets.length} datasets`
                  : `${datasets.length} dataset${datasets.length !== 1 ? "s" : ""}`
                }
                {" · "}
                <span>Atualizado automaticamente a cada 30s</span>
              </span>
            </div>
          </div>

        ) : (
          /* ── Grid view ── */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex flex-col"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #dddddd",
                    borderRadius: "14px",
                    padding: "1.25rem",
                    transition: "box-shadow 150ms, border-color 150ms",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px"
                    e.currentTarget.style.borderColor = "#c1c1c1"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "none"
                    e.currentTarget.style.borderColor = "#dddddd"
                  }}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        background: "rgba(255,56,92,0.06)",
                        border: "1px solid rgba(255,56,92,0.15)",
                      }}
                    >
                      <Database style={{ width: "18px", height: "18px", color: "#ff385c" }} />
                    </div>
                    <StatusBadge status={dataset.status}>{dataset.status_display}</StatusBadge>
                  </div>

                  {/* Title */}
                  <h3
                    className="leading-snug line-clamp-2 mb-3"
                    style={{
                      fontSize: "13px",
                      fontWeight: 510,
                      color: "#222222",
                      cursor: "pointer",
                      transition: "color 150ms",
                    }}
                    onClick={() => window.open(`/datasets/${dataset.id}`, "_blank")}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ff385c")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#222222")}
                  >
                    {dataset.table_name}
                  </h3>

                  {/* Metadata */}
                  <div className="space-y-1.5 mb-4 flex-1">
                    <div className="flex items-center gap-2" style={{ fontSize: "12px", color: "#6a6a6a" }}>
                      <Hash style={{ width: "13px", height: "13px", flexShrink: 0, color: "#929292" }} />
                      <span>
                        <span style={{ fontWeight: 510, color: "#3f3f3f" }}>
                          {dataset.record_count.toLocaleString("pt-BR")}
                        </span>{" "}
                        registros
                      </span>
                    </div>
                    <div className="flex items-center gap-2" style={{ fontSize: "12px", color: "#6a6a6a" }}>
                      <Columns3 style={{ width: "13px", height: "13px", flexShrink: 0, color: "#929292" }} />
                      <span>
                        <span style={{ fontWeight: 510, color: "#3f3f3f" }}>
                          {Object.keys(dataset.column_structure || {}).length}
                        </span>{" "}
                        colunas
                      </span>
                    </div>
                    <div className="flex items-center gap-2" style={{ fontSize: "12px", color: "#6a6a6a" }}>
                      <Calendar style={{ width: "13px", height: "13px", flexShrink: 0, color: "#929292" }} />
                      <span>{new Date(dataset.updated_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    {dataset.endpoint_url && (
                      <p
                        className="truncate"
                        style={{ fontSize: "12px", color: "#929292" }}
                        title={dataset.endpoint_url}
                      >
                        {dataset.endpoint_url}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-2 pt-3"
                    style={{ borderTop: "1px solid #ebebeb" }}
                  >
                    <button
                      className="flex items-center justify-center gap-1.5 flex-1"
                      style={{
                        height: "32px",
                        fontSize: "12px",
                        fontWeight: 510,
                        background: "#ff385c",
                        color: "#fff",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        transition: "background 150ms",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#e00b41")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#ff385c")}
                      onClick={() => window.open(`/datasets/${dataset.id}`, "_blank")}
                    >
                      <Eye style={{ width: "13px", height: "13px" }} />
                      Abrir
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          style={{
                            height: "32px",
                            width: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "8px",
                            border: "1px solid #dddddd",
                            background: "#f7f7f7",
                            cursor: "pointer",
                            color: "#6a6a6a",
                          }}
                        >
                          <MoreHorizontal style={{ width: "14px", height: "14px" }} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel className="text-xs" style={{ color: "#929292" }}>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs cursor-pointer"
                          onClick={() => window.open(`/datasets/${dataset.id}`, "_blank")}
                        >
                          <Eye className="h-3.5 w-3.5 mr-2" />
                          Abrir
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs cursor-pointer"
                          style={{ color: "#f59e0b" }}
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

            <div className="mt-4 text-right" style={{ fontSize: "12px", color: "#929292" }}>
              {filtered.length} {filtered.length === 1 ? "dataset" : "datasets"}
              {hasFilters && ` de ${datasets.length} total`}
              {" · "}Atualizado automaticamente a cada 30s
            </div>
          </>
        )}
      </div>

      {/* Dataset create dialog */}
      {isDialogOpen && (
        <Suspense fallback={
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <Loader2 style={{ width: "32px", height: "32px", color: "#ff385c", animation: "spin 1s linear infinite" }} />
          </div>
        }>
          <DatasetDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSubmit={handleCreateDataset} />
        </Suspense>
      )}
    </div>
  )
}
