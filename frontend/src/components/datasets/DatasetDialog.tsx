"use client"

import { useState } from "react"
import { Plus, Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface DatasetDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    import_type: 'endpoint' | 'file'
    table_name: string
    endpoint_url?: string
    file?: File
  }) => Promise<void>
}

export default function DatasetDialog({ isOpen, onClose, onSubmit }: DatasetDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("")
  const [importType, setImportType] = useState<"endpoint" | "file">("endpoint")
  const [datasetName, setDatasetName] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setUploadProgress(0)
    setUploadStatus("Preparando upload...")

    try {
      // Simula progresso visual até 90% enquanto aguarda resposta real
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      setUploadStatus("Enviando arquivo...")

      await onSubmit({
        import_type: importType,
        table_name: datasetName,
        endpoint_url: importType === 'endpoint' ? endpoint : undefined,
        file: importType === 'file' ? selectedFile || undefined : undefined,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus("Upload concluído!")

      await new Promise(resolve => setTimeout(resolve, 500))

      handleCancel()
    } catch (error) {
      setUploadStatus("Erro ao fazer upload")
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
      setUploadStatus("")
    }
  }

  const handleCancel = () => {
    setDatasetName("")
    setEndpoint("")
    setSelectedFile(null)
    setImportType("endpoint")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Dataset</DialogTitle>
          <DialogDescription>
            Preencha os dados do dataset e faça upload do arquivo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {isSubmitting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4 space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900">{uploadStatus}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Processando dados... Isso pode levar alguns instantes
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-3" />
                <p className="text-xs text-blue-600 text-right font-medium">
                  {uploadProgress}%
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nome do Dataset
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Digite o nome do dataset..."
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value.slice(0, 80))}
                maxLength={80}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                {datasetName.length}/80 caracteres
              </p>
            </div>

            <div className="grid gap-2">
              <Label>
                Tipo de Importação
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <RadioGroup
                value={importType}
                onValueChange={(value) => setImportType(value as "endpoint" | "file")}
                disabled={isSubmitting}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="endpoint" id="endpoint-radio" disabled={isSubmitting} />
                  <Label htmlFor="endpoint-radio" className="font-normal cursor-pointer">
                    Endpoint (URL)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file" id="file-radio" disabled={isSubmitting} />
                  <Label htmlFor="file-radio" className="font-normal cursor-pointer">
                    Arquivo (Excel/CSV)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {importType === "endpoint" && (
              <div className="grid gap-2">
                <Label htmlFor="endpoint">
                  Endpoint (URL)
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="endpoint"
                  type="url"
                  placeholder="https://exemplo.com/api/dados"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  required={importType === "endpoint"}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">
                  URL da API ou fonte de dados
                </p>
              </div>
            )}

            {importType === "file" && (
              <div className="grid gap-2">
                <Label htmlFor="file">
                  Arquivo
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Input
                      id="file"
                      type="file"
                      accept=".xls,.xlsx,.csv"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                      required={importType === "file" && !selectedFile}
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Formatos aceitos: XLS, XLSX, CSV
                  </p>
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                      <Upload className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-900 flex-1">
                        {selectedFile.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
