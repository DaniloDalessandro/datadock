"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  Database, Calendar, ArrowLeft, Upload, X, RefreshCw,
  Hash, Columns3, Archive, ArchiveRestore, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { apiGet } from "@/lib/api"
import { getAccessToken } from "@/lib/auth"
import { config } from "@/lib/config"
import { toast } from "sonner"

interface Dataset {
  id: number
  table_name: string
  status: string
  status_display: string
  record_count: number
  column_structure: Record<string, unknown>
  created_at: string
  updated_at: string
}

/* ── Shared style helpers ───────────────────────────────────── */

const btnOutline: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dddddd",
  color: "#3f3f3f",
  borderRadius: "8px",
  fontSize: "13px",
}

/* ── Meta card ──────────────────────────────────────────────── */
function MetaCard({ label, value, icon: Icon, statusNode, dataset }: {
  label: string
  value?: string | number | null
  icon?: React.ElementType | null
  statusNode?: boolean
  dataset?: Dataset
}) {
  return (
    <div>
      <p style={{ fontSize: "11px", color: "#929292", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 510 }}>
        {label}
      </p>
      {statusNode && dataset ? (
        <StatusBadge status={dataset.status} className="px-[10px] py-[2px] text-xs">
          {dataset.status_display || dataset.status}
        </StatusBadge>
      ) : (
        <div className="flex items-center gap-2">
          {Icon && <Icon style={{ width: "14px", height: "14px", color: "#929292", flexShrink: 0 }} />}
          <span style={{ fontSize: "15px", fontWeight: 510, color: "#222222" }}>{value}</span>
        </div>
      )}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
export default function DatasetDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [dataPreview, setDataPreview] = useState<Record<string, string | number | boolean>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  const loadDataset = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiGet(`/api/data-import/processes/${id}/`) as Dataset
      setDataset(data)
    } catch (error) {
      console.error("Error loading dataset:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao carregar dataset")
      setDataset(null)
      setIsLoading(false)
      setIsRefreshing(false)
      return
    }

    try {
      const previewData = await apiGet(`/api/data-import/processes/${id}/preview/`) as {
        success?: boolean
        data?: Record<string, string | number | boolean>[]
      }
      setDataPreview(previewData?.data || [])
    } catch {
      setDataPreview([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    if (id) loadDataset()
  }, [id, loadDataset])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
      if ([".xls", ".xlsx", ".csv"].includes(ext)) {
        setSelectedFile(file)
      } else {
        toast.error("Por favor, selecione apenas arquivos XLS, XLSX ou CSV")
        e.target.value = ""
      }
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !dataset) return
    setIsUploading(true)
    try {
      const token = getAccessToken()
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("import_type", "file")
      formData.append("table_name", dataset.table_name)

      const response = await fetch(`${config.apiUrl}/api/data-import/processes/${id}/append/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || "Registros adicionados com sucesso!")
        setIsUploadDialogOpen(false)
        setSelectedFile(null)
        loadDataset()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erro ao carregar arquivo")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar arquivo")
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfirmToggleStatus = async () => {
    if (!dataset) return
    setIsConfirmDialogOpen(false)
    setIsTogglingStatus(true)
    try {
      const token = getAccessToken()
      const response = await fetch(`${config.apiUrl}/api/data-import/processes/${id}/toggle-status/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || "Status alterado com sucesso!")
        loadDataset()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erro ao alterar status")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao alterar status")
    } finally {
      setIsTogglingStatus(false)
    }
  }

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#ffffff" }}
      >
        <div className="text-center">
          <div
            className="mx-auto"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "2px solid #dddddd",
              borderTopColor: "#ff385c",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p className="mt-3" style={{ fontSize: "13px", color: "#929292" }}>
            Carregando dataset...
          </p>
        </div>
      </div>
    )
  }

  /* ── Not found state ── */
  if (!dataset) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "#ffffff" }}
      >
        <div
          style={{
            padding: "14px",
            borderRadius: "14px",
            background: "rgba(255,56,92,0.06)",
          }}
        >
          <Database style={{ width: "40px", height: "40px", color: "#ff385c" }} />
        </div>
        <div className="text-center">
          <h3 style={{ fontSize: "16px", fontWeight: 590, color: "#222222", marginBottom: "6px" }}>
            Dataset não encontrado
          </h3>
          <p style={{ fontSize: "14px", color: "#6a6a6a" }}>
            O dataset não existe ou foi removido.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.close()}
          style={{ ...btnOutline, display: "flex", alignItems: "center", gap: "6px" }}
        >
          <ArrowLeft style={{ width: "14px", height: "14px" }} />
          Fechar
        </Button>
      </div>
    )
  }

  /* ── Main page ── */
  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>

      {/* ── Page header ── */}
      <div style={{ padding: "24px 32px 0" }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-2">
          <span style={{ fontSize: "13px", color: "#6a6a6a", cursor: "pointer" }}
            onClick={() => window.history.back()}>
            Datasets
          </span>
          <ChevronRight style={{ width: "13px", height: "13px", color: "#929292" }} />
          <span style={{ fontSize: "13px", color: "#6a6a6a" }} className="truncate max-w-xs">
            {dataset.table_name}
          </span>
        </div>

        {/* Title + actions row */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 510,
                letterSpacing: "-0.288px",
                color: "#222222",
                lineHeight: 1.2,
                marginBottom: "10px",
              }}
            >
              {dataset.table_name}
            </h1>

            {/* Metadata badges */}
            <div className="flex items-center flex-wrap gap-2">
              <StatusBadge status={dataset.status} className="px-[10px] py-[2px] text-xs">
                {dataset.status_display || dataset.status}
              </StatusBadge>

              <span
                style={{
                  fontSize: "12px",
                  color: "#6a6a6a",
                  background: "#f7f7f7",
                  border: "1px solid #ebebeb",
                  borderRadius: "9999px",
                  padding: "2px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Hash style={{ width: "11px", height: "11px" }} />
                {dataset.record_count.toLocaleString("pt-BR")} registros
              </span>

              <span
                style={{
                  fontSize: "12px",
                  color: "#6a6a6a",
                  background: "#f7f7f7",
                  border: "1px solid #ebebeb",
                  borderRadius: "9999px",
                  padding: "2px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Columns3 style={{ width: "11px", height: "11px" }} />
                {Object.keys(dataset.column_structure || {}).length} colunas
              </span>

              <span style={{ fontSize: "12px", color: "#929292" }}>
                ID: {dataset.id}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsUploadDialogOpen(true)}
              style={{
                background: "#ff385c",
                color: "#fff",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 510,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                height: "34px",
                padding: "0 14px",
                transition: "background 150ms",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#e00b41")}
              onMouseLeave={e => (e.currentTarget.style.background = "#ff385c")}
            >
              <Upload style={{ width: "14px", height: "14px" }} />
              Carregar Dados
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={isTogglingStatus}
              style={
                dataset.status === "active"
                  ? {
                      background: "rgba(193,53,21,0.04)",
                      border: "1px solid rgba(193,53,21,0.25)",
                      color: "#c13515",
                      borderRadius: "8px",
                      fontSize: "13px",
                      height: "34px",
                      padding: "0 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }
                  : {
                      background: "rgba(39,166,68,0.04)",
                      border: "1px solid rgba(39,166,68,0.25)",
                      color: "#27a644",
                      borderRadius: "8px",
                      fontSize: "13px",
                      height: "34px",
                      padding: "0 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }
              }
            >
              {dataset.status === "active" ? (
                <>
                  <Archive style={{ width: "14px", height: "14px" }} />
                  {isTogglingStatus ? "Arquivando..." : "Arquivar"}
                </>
              ) : (
                <>
                  <ArchiveRestore style={{ width: "14px", height: "14px" }} />
                  {isTogglingStatus ? "Ativando..." : "Ativar"}
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => { setIsRefreshing(true); loadDataset() }}
              disabled={isRefreshing}
              style={{
                ...btnOutline,
                height: "34px",
                padding: "0 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <RefreshCw
                style={{
                  width: "14px",
                  height: "14px",
                  animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
                }}
              />
              {isRefreshing ? "Atualizando..." : "Atualizar"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => window.close()}
              style={{
                ...btnOutline,
                height: "34px",
                padding: "0 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ArrowLeft style={{ width: "14px", height: "14px" }} />
              Fechar
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "24px 32px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Info cards */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #dddddd",
          borderRadius: "14px",
          padding: "20px 24px",
        }}>
          <p style={{ fontSize: "12px", fontWeight: 510, color: "#929292", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Informações Gerais
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            <MetaCard label="Registros" icon={Hash} value={dataset.record_count.toLocaleString("pt-BR")} />
            <MetaCard label="Colunas" icon={Columns3} value={Object.keys(dataset.column_structure || {}).length} />
            <MetaCard label="Status" statusNode dataset={dataset} />
            <MetaCard label="Última Atualização" icon={Calendar} value={new Date(dataset.updated_at).toLocaleDateString("pt-BR")} />
            <MetaCard label="Data de Criação" icon={Calendar} value={new Date(dataset.created_at).toLocaleDateString("pt-BR")} />
          </div>
        </div>

        {/* Data preview */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #dddddd",
          borderRadius: "14px",
          overflow: "hidden",
        }}>
          {/* Toolbar */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #ebebeb",
              background: "#f7f7f7",
            }}
          >
            <div>
              <p style={{ fontSize: "13px", fontWeight: 510, color: "#222222" }}>
                Prévia dos Dados
              </p>
              <p style={{ fontSize: "12px", color: "#929292", marginTop: "1px" }}>
                Primeiras linhas do dataset
              </p>
            </div>
            {dataPreview.length > 0 && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#6a6a6a",
                  background: "#f2f2f2",
                  border: "1px solid #ebebeb",
                  borderRadius: "9999px",
                  padding: "2px 10px",
                }}
              >
                {dataPreview.length} / {dataset.record_count.toLocaleString("pt-BR")} linhas
              </span>
            )}
          </div>

          {dataPreview.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center" style={{ padding: "48px 24px" }}>
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#f7f7f7",
                  marginBottom: "12px",
                  display: "inline-flex",
                }}
              >
                <Database style={{ width: "28px", height: "28px", color: "#929292" }} />
              </div>
              <p style={{ fontSize: "14px", fontWeight: 510, color: "#6a6a6a" }}>
                Nenhum dado disponível para prévia
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow
                    className="border-0 hover:bg-transparent"
                    style={{ background: "#f7f7f7" }}
                  >
                    <TableHead
                      className="py-2.5 px-4 border-0 w-12"
                      style={{
                        fontSize: "11px",
                        fontWeight: 510,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "#929292",
                      }}
                    >
                      #
                    </TableHead>
                    {Object.keys(dataPreview[0]).map((key) => (
                      <TableHead
                        key={key}
                        className="py-2.5 px-4 border-0"
                        style={{
                          fontSize: "11px",
                          fontWeight: 510,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "#929292",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {key}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataPreview.map((row, index) => (
                    <TableRow
                      key={index}
                      className="border-0 transition-colors duration-100"
                      style={{ borderTop: "1px solid #ebebeb" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f7")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <TableCell
                        className="py-2.5 px-4 border-0 font-mono"
                        style={{ fontSize: "11px", color: "#929292" }}
                      >
                        {index + 1}
                      </TableCell>
                      {Object.values(row).map((value, i) => (
                        <TableCell
                          key={i}
                          className="py-2.5 px-4 border-0"
                          style={{
                            fontSize: "12px",
                            color: "#3f3f3f",
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {value !== null && value !== undefined
                            ? String(value)
                            : <span style={{ color: "#929292" }}>—</span>
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm toggle dialog ── */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent
          style={{
            padding: "0",
          }}
        >
          <DialogHeader style={{ padding: "24px 24px 20px", borderBottom: "1px solid #ebebeb" }}>
            <DialogTitle
              style={{
                fontSize: "16px",
                fontWeight: 590,
                letterSpacing: "-0.24px",
              }}
            >
              {dataset.status === "active" ? "Arquivar Dataset" : "Ativar Dataset"}
            </DialogTitle>
            <DialogDescription style={{ fontSize: "13px", marginTop: "6px" }}>
              {dataset.status === "active"
                ? `Tem certeza que deseja arquivar "${dataset.table_name}"? O dataset ficará inativo e não aparecerá nas listagens públicas.`
                : `Tem certeza que deseja ativar "${dataset.table_name}"? O dataset voltará a aparecer nas listagens públicas.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter
            className="gap-2"
            style={{ padding: "16px 24px", borderTop: "1px solid #ebebeb" }}
          >
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              style={{ ...btnOutline, height: "34px", fontSize: "13px" }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmToggleStatus}
              style={
                dataset.status === "active"
                  ? {
                      background: "rgba(193,53,21,0.06)",
                      border: "1px solid rgba(193,53,21,0.25)",
                      color: "#c13515",
                      borderRadius: "8px",
                      fontSize: "13px",
                      height: "34px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }
                  : {
                      background: "#ff385c",
                      color: "#fff",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "13px",
                      height: "34px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }
              }
            >
              {dataset.status === "active" ? (
                <><Archive style={{ width: "14px", height: "14px" }} />Arquivar</>
              ) : (
                <><ArchiveRestore style={{ width: "14px", height: "14px" }} />Ativar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Upload dialog ── */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent
          style={{
            padding: "0",
          }}
        >
          <DialogHeader style={{ padding: "24px 24px 20px", borderBottom: "1px solid #ebebeb" }}>
            <DialogTitle
              style={{
                fontSize: "16px",
                fontWeight: 590,
                letterSpacing: "-0.24px",
              }}
            >
              Carregar Mais Dados
            </DialogTitle>
            <DialogDescription style={{ fontSize: "13px", marginTop: "6px" }}>
              Faça upload de um arquivo para adicionar dados ao dataset &quot;{dataset.table_name}&quot;
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit}>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <Label
                  htmlFor="upload-file"
                  style={{
                    fontSize: "12px",
                    fontWeight: 510,
                    color: "#222222",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Selecione o Arquivo{" "}
                  <span style={{ color: "#c13515" }}>*</span>
                </Label>
                <Input
                  id="upload-file"
                  type="file"
                  accept=".xls,.xlsx,.csv"
                  onChange={handleFileChange}
                  required
                  style={{
                    height: "34px",
                    fontSize: "12px",
                    background: "#ffffff",
                    border: "1px solid #dddddd",
                    borderRadius: "8px",
                    color: "#3f3f3f",
                    cursor: "pointer",
                  }}
                />
                <p style={{ fontSize: "11px", color: "#929292", marginTop: "4px" }}>
                  Formatos aceitos: XLS, XLSX, CSV
                </p>

                {selectedFile && (
                  <div
                    className="flex items-center gap-3 mt-3"
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "rgba(255,56,92,0.04)",
                      border: "1px solid rgba(255,56,92,0.15)",
                    }}
                  >
                    <Upload style={{ width: "14px", height: "14px", color: "#ff385c", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{ fontSize: "13px", fontWeight: 510, color: "#222222" }}
                      >
                        {selectedFile.name}
                      </p>
                      <p style={{ fontSize: "11px", color: "#929292" }}>
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      style={{
                        padding: "4px",
                        borderRadius: "4px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#929292",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X style={{ width: "13px", height: "13px" }} />
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "rgba(245,158,11,0.04)",
                  border: "1px solid rgba(245,158,11,0.15)",
                }}
              >
                <h4 style={{ fontSize: "12px", fontWeight: 510, color: "#d97706", marginBottom: "6px" }}>
                  Informações:
                </h4>
                <ul style={{ fontSize: "12px", color: "#3f3f3f", display: "flex", flexDirection: "column", gap: "3px" }}>
                  <li>• Os dados serão adicionados ao dataset existente</li>
                  <li>• Certifique-se de que as colunas correspondam ao formato atual</li>
                  <li>• Registros duplicados serão identificados automaticamente</li>
                </ul>
              </div>
            </div>

            <DialogFooter
              className="gap-2"
              style={{ padding: "16px 24px", borderTop: "1px solid #ebebeb" }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsUploadDialogOpen(false); setSelectedFile(null) }}
                disabled={isUploading}
                style={{ ...btnOutline, height: "34px", fontSize: "13px" }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                style={{
                  background: "#ff385c",
                  color: "#fff",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 510,
                  height: "34px",
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "background 150ms",
                }}
                onMouseEnter={e => { if (!isUploading) e.currentTarget.style.background = "#e00b41" }}
                onMouseLeave={e => { if (!isUploading) e.currentTarget.style.background = "#ff385c" }}
              >
                {isUploading ? (
                  <>
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        animation: "spin 0.8s linear infinite",
                        flexShrink: 0,
                      }}
                    />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Upload style={{ width: "14px", height: "14px" }} />
                    Carregar Arquivo
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
