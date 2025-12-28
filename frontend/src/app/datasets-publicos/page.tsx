"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Database, Loader2, Table2, Calendar, Hash, Columns3, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ColumnFilterPopover, FilterValue } from "@/components/filters"

interface ColumnMetadata {
  name: string
  type: string
  filter_type: string
  unique_values: string[]
}

interface SearchResult {
  process_id: number
  table_name: string
  columns: string[]
  data: Record<string, string | number | boolean>[]
  count: number
}

interface PublicDataset {
  id: number
  table_name: string
  status: string
  status_display: string
  record_count: number
  column_structure: Record<string, unknown>
  created_at: string
}

interface PublicDataResponse {
  success: boolean;
  data: Record<string, string | number | boolean>[];
  // Adiciona outras propriedades if they exist in the response
}

export default function DatasetsPublicosPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [datasets, setDatasets] = useState<PublicDataset[]>([])
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true)
  const [selectedDataset, setSelectedDataset] = useState<PublicDataset | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [downloadFormat, setDownloadFormat] = useState<string>("csv")
  const [columnMetadata, setColumnMetadata] = useState<ColumnMetadata[]>([])
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue>>({})
  const [filteredData, setFilteredData] = useState<Record<string, string | number | boolean>[]>([])

  // Busca datasets públicos ao montar
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE_URL}/api/data-import/public-datasets/`)

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setDatasets(data.results || [])
          }
        }
      } catch (error) {
        console.error("Error fetching datasets:", error)
      } finally {
        setIsLoadingDatasets(false)
      }
    }

    fetchDatasets()
  }, [])

  const handleDatasetClick = async (dataset: PublicDataset) => {
    setSelectedDataset(dataset)
    setIsModalOpen(true)
    setIsSearching(true)

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Busca metadados das colunas
      const metadataResponse = await fetch(
        `${API_BASE_URL}/api/data-import/public-metadata/${dataset.id}/`
      )

      if (metadataResponse.ok) {
        const metadataData = await metadataResponse.json()
        if (metadataData.success) {
          setColumnMetadata(metadataData.columns || [])
          setSelectedColumns(metadataData.columns?.map((col: ColumnMetadata) => col.name) || [])
        }
      }

      // Busca dados do dataset
      const dataResponse = await fetch(
        `${API_BASE_URL}/api/data-import/public-data/${dataset.id}/`
      )

      if (dataResponse.ok) {
        const data: PublicDataResponse = await dataResponse.json()
        if (data.success && data.data) {
          setFilteredData(data.data)
        }
      }
    } catch (error) {
      console.error("Error fetching dataset details:", error)
      toast.error("Erro ao carregar detalhes do dataset")
    } finally {
      setIsSearching(false)
    }
  }

  const handleDownload = async (datasetId: number, tableName: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Monta os parâmetros da URL
      const params = new URLSearchParams()
      params.append('file_format', downloadFormat)

      // Adiciona colunas selecionadas
      if (selectedColumns.length > 0) {
        params.append('columns', selectedColumns.join(','))
      }

      // Adiciona filtros se existirem
      if (Object.keys(activeFilters).length > 0) {
        params.append('filters', JSON.stringify(activeFilters))
        console.log('[DOWNLOAD] Enviando filtros:', activeFilters)
      } else {
        console.log('[DOWNLOAD] Nenhum filtro aplicado')
      }

      const url = `${API_BASE_URL}/api/data-import/public-download/${datasetId}/?${params.toString()}`
      console.log('[DOWNLOAD] URL:', url)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Erro ao baixar arquivo")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${tableName}.${downloadFormat}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      const filterInfo = Object.keys(activeFilters).length > 0
        ? ` (${displayData.length} registros filtrados)`
        : ''
      toast.success(`Arquivo ${tableName}.${downloadFormat} baixado com sucesso!${filterInfo}`)
    } catch (error) {
      console.error("Error downloading file:", error)
      toast.error("Erro ao baixar arquivo")
    }
  }

  const toggleColumn = (columnName: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnName)
        ? prev.filter(col => col !== columnName)
        : [...prev, columnName]
    )
  }

  const toggleAllColumns = () => {
    const allColumns = Object.keys(selectedDataset?.column_structure || {})
    if (selectedColumns.length === allColumns.length) {
      setSelectedColumns([])
    } else {
      setSelectedColumns(allColumns)
    }
  }

  const applyFilters = (data: Record<string, string | number | boolean>[]) => {
    if (Object.keys(activeFilters).length === 0) return data

    return data.filter(row => {
      return Object.entries(activeFilters).every(([columnName, filter]) => {
        if (!filter) return true

        const cellValue = row[columnName]
        const strValue = cellValue !== null && cellValue !== undefined ? String(cellValue).toLowerCase() : ""

        switch (filter.type) {
          case "string":
            const filterVal = ((filter.value as string) || "").toLowerCase()
            if (!filterVal) return true

            switch (filter.operator) {
              case "contains":
                return strValue.includes(filterVal)
              case "equals":
                return strValue === filterVal
              case "startsWith":
                return strValue.startsWith(filterVal)
              case "endsWith":
                return strValue.endsWith(filterVal)
              default:
                return true
            }

          case "number":
          case "integer":
          case "float":
            const numValue = parseFloat(String(cellValue))
            const numFilter = parseFloat(filter.value as string)

            if (isNaN(numFilter)) return true

            switch (filter.operator) {
              case "equals":
                return numValue === numFilter
              case "notEquals":
                return numValue !== numFilter
              case "greaterThan":
                return numValue > numFilter
              case "lessThan":
                return numValue < numFilter
              case "greaterThanOrEqual":
                return numValue >= numFilter
              case "lessThanOrEqual":
                return numValue <= numFilter
              case "between":
                const numFilter2 = parseFloat(filter.value2 || "")
                return !isNaN(numFilter2) && numValue >= numFilter && numValue <= numFilter2
              default:
                return true
            }

          case "boolean":
            if (filter.value === "all") return true
            const boolValue = String(cellValue).toLowerCase()
            return boolValue === filter.value

          case "category":
            const selectedValues = filter.value as string[]
            if (!selectedValues || selectedValues.length === 0) return true
            return selectedValues.some(val =>
              String(cellValue).toLowerCase() === val.toLowerCase()
            )

          case "date":
          case "datetime":
            const dateValue = new Date(String(cellValue))
            const filterDate = new Date(filter.value as string)

            if (isNaN(filterDate.getTime())) return true

            switch (filter.operator) {
              case "equals":
                return dateValue.toDateString() === filterDate.toDateString()
              case "before":
                return dateValue < filterDate
              case "after":
                return dateValue > filterDate
              case "between":
                const filterDate2 = new Date(filter.value2 || "")
                return !isNaN(filterDate2.getTime()) && dateValue >= filterDate && dateValue <= filterDate2
              default:
                return true
            }

          default:
            return true
        }
      })
    })
  }

  const displayData = applyFilters(filteredData)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200 shadow-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-md border-2 border-blue-200">
              <Database className="h-14 w-14 text-blue-500" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-gray-800 mb-2 tracking-tight">
                Datasets Públicos
              </h1>
              <p className="text-gray-600 text-xl font-medium flex items-center gap-2">
                <span className="bg-blue-100 px-4 py-1.5 rounded-full border border-blue-300 text-blue-700">
                  {datasets.length} {datasets.length === 1 ? 'dataset disponível' : 'datasets disponíveis'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Datasets Grid */}
        {isLoadingDatasets ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mr-4" />
            <span className="text-xl text-black font-medium">Carregando datasets...</span>
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-20">
            <Database className="h-16 w-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-black mb-2">
              Nenhum dataset disponível
            </h3>
            <p className="text-black">
              Não há datasets públicos no momento
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {datasets.map((dataset) => (
              <div key={dataset.id} onClick={() => handleDatasetClick(dataset)} className="cursor-pointer">
                <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 border-blue-100 hover:border-blue-400 bg-white h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Database className="h-6 w-6 text-blue-600" />
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-black mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {dataset.table_name}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-black">
                          <Hash className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="font-semibold">{dataset.record_count.toLocaleString()}</span>
                          <span className="ml-1">registros</span>
                        </div>
                        <div className="flex items-center text-sm text-black">
                          <Columns3 className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="font-semibold">{Object.keys(dataset.column_structure || {}).length}</span>
                          <span className="ml-1">colunas</span>
                        </div>
                        <div className="flex items-center text-sm text-black">
                          <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                          <span>{new Date(dataset.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dataset Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open)
        if (!open) {
          setSearchResults([])
          setActiveFilters({})
        }
      }}>
        <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[95vh] flex flex-col p-6">
          {selectedDataset && (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2 text-black">
                  <Database className="h-5 w-5" />
                  {selectedDataset.table_name}
                </DialogTitle>
              </DialogHeader>

              <div className="flex-shrink-0 flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Registros:</span>
                    <span className="font-bold text-black">{selectedDataset.record_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Columns3 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Colunas:</span>
                    <span className="font-bold text-black">{Object.keys(selectedDataset.column_structure || {}).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Criado em:</span>
                    <span className="font-bold text-black">{new Date(selectedDataset.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={downloadFormat} onValueChange={setDownloadFormat}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleDownload(selectedDataset.id, selectedDataset.table_name)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:bg-gray-100 hover:border-black"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto mt-4">
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-black mr-3" />
                    <span className="text-lg text-gray-700 font-medium">Carregando dados...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-[50px] font-bold text-black sticky top-0 bg-gray-50">
                            <Checkbox
                              checked={selectedColumns.length === Object.keys(selectedDataset.column_structure || {}).length}
                              onCheckedChange={toggleAllColumns}
                            />
                          </TableHead>
                          {columnMetadata
                            .filter(col => selectedColumns.includes(col.name))
                            .map((column) => (
                              <TableHead key={column.name} className="font-bold text-black sticky top-0 bg-gray-50 min-w-[150px]">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={selectedColumns.includes(column.name)}
                                      onCheckedChange={() => toggleColumn(column.name)}
                                    />
                                    <span>{column.name}</span>
                                  </div>
                                  <ColumnFilterPopover
                                    column={column.name}
                                    columnType={column.filter_type}
                                    uniqueValues={column.unique_values}
                                    value={activeFilters[column.name]}
                                    onChange={(value) => {
                                      setActiveFilters(prev => {
                                        if (value === null) {
                                          const newFilters = { ...prev }
                                          delete newFilters[column.name]
                                          return newFilters
                                        }
                                        return {
                                          ...prev,
                                          [column.name]: value
                                        }
                                      })
                                    }}
                                    isActive={!!activeFilters[column.name]}
                                  />
                                </div>
                              </TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayData.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={selectedColumns.length + 1}
                              className="text-center py-12 text-gray-500"
                            >
                              Nenhum registro encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayData.map((row, idx) => (
                            <TableRow key={idx} className="hover:bg-gray-50">
                              <TableCell className="text-gray-400 font-mono text-sm">
                                {idx + 1}
                              </TableCell>
                              {columnMetadata
                                .filter(col => selectedColumns.includes(col.name))
                                .map((column) => (
                                  <TableCell key={column.name} className="text-black">
                                    {row[column.name] !== null && row[column.name] !== undefined
                                      ? String(row[column.name])
                                      : '-'}
                                  </TableCell>
                                ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
