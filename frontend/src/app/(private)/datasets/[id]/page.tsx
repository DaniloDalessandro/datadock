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
    if (id) {
      loadDataset()
    }
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Sucesso!',
          description: data.message || `Registros adicionados com sucesso!`
        })
        setIsUploadDialogOpen(false)
        setSelectedFile(null)
        loadDataset() // Reload dataset
      } else {
        const errorData = await response.json()
        toast({
          title: 'Erro ao carregar arquivo',
          description: errorData.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: 'Erro ao carregar arquivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancelUpload = () => {
    setIsUploadDialogOpen(false)
    setSelectedFile(null)
  }

  const handleToggleStatusClick = () => {
    setIsConfirmDialogOpen(true)
  }

  const handleConfirmToggleStatus = async () => {
    if (!dataset) return

    setIsConfirmDialogOpen(false)
    setIsTogglingStatus(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${config.apiUrl}/api/data-import/processes/${id}/toggle-status/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Sucesso!',
          description: data.message || 'Status alterado com sucesso!'
        })
        loadDataset() // Reload dataset
      } else {
        const errorData = await response.json()
        toast({
          title: 'Erro ao alterar status',
          description: errorData.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      toast({
        title: 'Erro ao alterar status',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo"
      case "archived":
        return "Arquivado"
      case "processing":
        return "Processando"
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando detalhes do dataset...</span>
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Database className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Dataset não encontrado
        </h3>
        <p className="text-gray-500 mb-4">
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="w-full space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{dataset.table_name}</h1>
              <div className="flex items-center gap-3 mt-3">
                <Badge className={getStatusColor(dataset.status)}>
                  {getStatusLabel(dataset.status)}
                </Badge>
                <span className="text-sm text-gray-500">
                  ID: {dataset.id}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
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
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Button variant="outline" onClick={() => window.close()}>
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
                <p className="text-sm font-medium text-gray-500">Total de Registros</p>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <p className="text-lg font-semibold">{dataset.record_count.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Total de Colunas</p>
                <div className="flex items-center gap-2">
                  <Columns3 className="h-4 w-4 text-gray-400" />
                  <p className="text-lg font-semibold">{Object.keys(dataset.column_structure || {}).length}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Última Atualização</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-lg font-semibold">
                    {new Date(dataset.updated_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Data de Criação</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-lg font-semibold">
                    {new Date(dataset.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Status</p>
                <Badge className={getStatusColor(dataset.status)}>
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
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum dado disponível</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        {Object.keys(dataPreview[0]).map((key) => (
                          <TableHead key={key} className="font-semibold">
                            {key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataPreview.map((row: Record<string, string | number | boolean>, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-gray-400">{index + 1}</TableCell>
                          {Object.values(row).map((value: string | number | boolean | null | undefined, i: number) => (
                            <TableCell key={i}>
                              {value !== null && value !== undefined ? String(value) : '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Mostrando {dataPreview.length} de {dataset.record_count.toLocaleString()} registros
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {dataset?.status === 'active' ? 'Arquivar Dataset' : 'Ativar Dataset'}
            </DialogTitle>
            <DialogDescription>
              {dataset?.status === 'active'
                ? `Tem certeza que deseja arquivar o dataset "${dataset?.table_name}"? O dataset ficará inativo e não aparecerá nas listagens públicas.`
                : `Tem certeza que deseja ativar o dataset "${dataset?.table_name}"? O dataset voltará a aparecer nas listagens públicas.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={dataset?.status === 'active' ? 'destructive' : 'default'}
              onClick={handleConfirmToggleStatus}
            >
              {dataset?.status === 'active' ? (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar
                </>
              ) : (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Ativar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Carregar Mais Dados</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo para adicionar mais dados ao dataset &quot;{dataset.table_name}&quot;
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="upload-file">
                  Selecione o Arquivo
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Input
                      id="upload-file"
                      type="file"
                      accept=".xls,.xlsx,.csv"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Formatos aceitos: XLS, XLSX, CSV
                  </p>
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <Upload className="h-5 w-5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-blue-700">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                      >
                        <X className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Informações:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Os dados do arquivo serão adicionados ao dataset existente</li>
                  <li>• Certifique-se de que as colunas correspondam ao formato atual</li>
                  <li>• Registros duplicados serão identificados automaticamente</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelUpload}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
