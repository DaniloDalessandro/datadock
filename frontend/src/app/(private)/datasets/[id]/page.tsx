"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Database, Calendar, ArrowLeft, Upload, X, RefreshCw, Hash, Columns3, Archive, ArchiveRestore } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { apiGet } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { config } from "@/lib/config"

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

export default function DatasetDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const { toast } = useToast()
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

      const previewData = await apiGet(`/api/data-import/processes/${id}/preview/`) as {
        data: Record<string, string | number | boolean>[]
      }
      setDataPreview(previewData.data || [])
    } catch (error) {
      console.error('Error loading dataset:', error)
      toast({
        title: 'Erro ao carregar dataset',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
      setDataset(null)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    if (id) loadDataset()
  }, [id, loadDataset])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadDataset()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validExtensions = ['.xls', '.xlsx', '.csv']
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (validExtensions.includes(fileExtension)) {
        setSelectedFile(file)
      } else {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione apenas arquivos XLS, XLSX ou CSV',
          variant: 'destructive'
        })
        event.target.value = ''
      }
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !dataset) return

    setIsUploading(true)
    try {
      const token = localStorage.getItem('access_token')
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('import_type', 'file')
      formData.append('table_name', dataset.table_name)

      const response = await fetch(`${config.apiUrl}/api/data-import/processes/${id}/append/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        toast({ title: 'Sucesso!', description: data.message || 'Registros adicionados com sucesso!' })
        setIsUploadDialogOpen(false)
        setSelectedFile(null)
        loadDataset()
      } else {
        const errorData = await response.json()
        toast({ title: 'Erro ao carregar arquivo', description: errorData.error || 'Erro desconhecido', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({ title: 'Erro ao carregar arquivo', description: error instanceof Error ? error.message : 'Erro desconhecido', variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancelUpload = () => {
    setIsUploadDialogOpen(false)
    setSelectedFile(null)
  }

  const handleToggleStatusClick = () => setIsConfirmDialogOpen(true)

  const handleConfirmToggleStatus = async () => {
    if (!dataset) return
    setIsConfirmDialogOpen(false)
    setIsTogglingStatus(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${config.apiUrl}/api/data-import/processes/${id}/toggle-status/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        toast({ title: 'Sucesso!', description: data.message || 'Status alterado com sucesso!' })
        loadDataset()
      } else {
        const errorData = await response.json()
        toast({ title: 'Erro ao alterar status', description: errorData.error || 'Erro desconhecido', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      toast({ title: 'Erro ao alterar status', description: error instanceof Error ? error.message : 'Erro desconhecido', variant: 'destructive' })
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const getStatusVariant = (status: string): "success" | "warning" | "secondary" => {
    switch (status) {
      case "active": return "success"
      case "processing": return "warning"
      default: return "secondary"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Ativo"
      case "archived": return "Arquivado"
      case "processing": return "Processando"
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#ffffff]">
        <div className="w-8 h-8 border-2 border-[#e0e0e0] border-t-[#000000] rounded-full animate-spin" />
        <span className="ml-3 font-bold text-[#000000]">Carregando...</span>
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#ffffff]">
        <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-4">
          <Database className="h-8 w-8 text-[#a0a0a0]" />
        </div>
        <h3 className="text-[24px] font-bold text-[#000000] mb-2 tracking-[-0.02em]">
          Dataset não encontrado
        </h3>
        <p className="text-[#7a7a7a] mb-6 text-sm">
          O dataset que você está procurando não existe ou foi removido.
        </p>
        <Button onClick={() => window.close()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Fechar
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#ffffff] p-6">
      <div className="w-full space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#f5f5f7] rounded-full flex items-center justify-center flex-shrink-0">
              <Database className="h-7 w-7 text-[#000000]" />
            </div>
            <div>
              <h1 className="text-[28px] font-bold text-[#000000] leading-[1.2] tracking-[-0.02em]">
                {dataset.table_name}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant={getStatusVariant(dataset.status)}>
                  {getStatusLabel(dataset.status)}
                </Badge>
                <span className="text-sm text-[#a0a0a0] font-medium">
                  ID: {dataset.id}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Carregar Mais Dados
            </Button>
            <Button
              variant={dataset.status === 'active' ? 'destructive' : 'default'}
              onClick={handleToggleStatusClick}
              disabled={isTogglingStatus}
            >
              {dataset.status === 'active' ? (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  {isTogglingStatus ? 'Arquivando...' : 'Arquivar'}
                </>
              ) : (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  {isTogglingStatus ? 'Ativando...' : 'Ativar'}
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Button variant="secondary" onClick={() => window.close()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#7a7a7a] uppercase tracking-widest">Total de Registros</p>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#a0a0a0]" />
                  <p className="text-lg font-bold text-[#000000]">{dataset.record_count.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[#7a7a7a] uppercase tracking-widest">Total de Colunas</p>
                <div className="flex items-center gap-2">
                  <Columns3 className="h-4 w-4 text-[#a0a0a0]" />
                  <p className="text-lg font-bold text-[#000000]">{Object.keys(dataset.column_structure || {}).length}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[#7a7a7a] uppercase tracking-widest">Última Atualização</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#a0a0a0]" />
                  <p className="text-lg font-bold text-[#000000]">
                    {new Date(dataset.updated_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[#7a7a7a] uppercase tracking-widest">Data de Criação</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#a0a0a0]" />
                  <p className="text-lg font-bold text-[#000000]">
                    {new Date(dataset.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[#7a7a7a] uppercase tracking-widest">Status</p>
                <Badge variant={getStatusVariant(dataset.status)}>
                  {getStatusLabel(dataset.status)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prévia dos Dados (primeiras linhas)</CardTitle>
          </CardHeader>
          <CardContent>
            {dataPreview.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Database className="h-6 w-6 text-[#a0a0a0]" />
                </div>
                <p className="text-[#7a7a7a]">Nenhum dado disponível</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#f5f5f7]">
                        <TableHead className="w-[50px] text-[#7a7a7a]">#</TableHead>
                        {Object.keys(dataPreview[0]).map((key) => (
                          <TableHead key={key} className="font-bold text-[#000000]">
                            {key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataPreview.map((row, index) => (
                        <TableRow key={index} className="hover:bg-[#f5f5f7]">
                          <TableCell className="font-medium text-[#a0a0a0]">{index + 1}</TableCell>
                          {Object.values(row).map((value, i) => (
                            <TableCell key={i} className="text-[#000000]">
                              {value !== null && value !== undefined ? String(value) : '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-[#7a7a7a] mt-4">
                  Mostrando {dataPreview.length} de {dataset.record_count.toLocaleString()} registros
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[18px] border-[#e0e0e0]">
          <DialogHeader>
            <DialogTitle className="font-bold text-[#000000] tracking-[-0.02em]">
              {dataset?.status === 'active' ? 'Arquivar Dataset' : 'Ativar Dataset'}
            </DialogTitle>
            <DialogDescription className="text-[#7a7a7a]">
              {dataset?.status === 'active'
                ? `Tem certeza que deseja arquivar o dataset "${dataset?.table_name}"? O dataset ficará inativo e não aparecerá nas listagens públicas.`
                : `Tem certeza que deseja ativar o dataset "${dataset?.table_name}"? O dataset voltará a aparecer nas listagens públicas.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={dataset?.status === 'active' ? 'destructive' : 'default'}
              onClick={handleConfirmToggleStatus}
            >
              {dataset?.status === 'active' ? (
                <><Archive className="h-4 w-4 mr-2" />Arquivar</>
              ) : (
                <><ArchiveRestore className="h-4 w-4 mr-2" />Ativar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[18px] border-[#e0e0e0]">
          <DialogHeader>
            <DialogTitle className="font-bold text-[#000000] tracking-[-0.02em]">
              Carregar Mais Dados
            </DialogTitle>
            <DialogDescription className="text-[#7a7a7a]">
              Faça upload de um arquivo para adicionar mais dados ao dataset &quot;{dataset.table_name}&quot;
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="upload-file" className="text-xs font-bold uppercase tracking-widest text-[#000000]">
                  Selecione o Arquivo
                  <span className="text-[#cc0000] ml-1">*</span>
                </Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="upload-file"
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    required
                  />
                  <p className="text-xs text-[#7a7a7a]">
                    Formatos aceitos: XLS, XLSX, CSV
                  </p>
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-3 border border-[#e0e0e0] bg-[#f5f5f7] rounded-[16px]">
                      <Upload className="h-5 w-5 text-[#000000]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#000000] truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-[#7a7a7a]">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-[#e0e0e0] bg-[#f5f5f7] p-4 rounded-[16px]">
                <h4 className="text-xs font-bold text-[#000000] uppercase tracking-widest mb-2">
                  Informações
                </h4>
                <ul className="text-xs text-[#7a7a7a] space-y-1">
                  <li>• Os dados do arquivo serão adicionados ao dataset existente</li>
                  <li>• Certifique-se de que as colunas correspondam ao formato atual</li>
                  <li>• Registros duplicados serão identificados automaticamente</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleCancelUpload} disabled={isUploading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#ffffff]/30 border-t-[#ffffff] rounded-full animate-spin mr-2" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
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
