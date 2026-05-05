"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Database, Loader2, Calendar, Hash, Columns3, CheckCircle2 } from "lucide-react"
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
import { config } from "@/lib/config"

interface ColumnMetadata {
  name: string
  type: string
  filter_type: string
  unique_values: string[]
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
}

export default function DatasetsPublicosPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [datasets, setDatasets] = useState<PublicDataset[]>([])
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true)
  const [selectedDataset, setSelectedDataset] = useState<PublicDataset | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [downloadFormat, setDownloadFormat] = useState<string>("csv")
  const [columnMetadata, setColumnMetadata] = useState<ColumnMetadata[]>([])
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue>>({})
  const [filteredData, setFilteredData] = useState<Record<string, string | number | boolean>[]>([])

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const API_BASE_URL = config.apiUrl
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
      const API_BASE_URL = config.apiUrl

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
      const API_BASE_URL = config.apiUrl
      const params = new URLSearchParams()
      params.append('file_format', downloadFormat)
      if (selectedColumns.length > 0) {
        params.append('columns', selectedColumns.join(','))
      }
      if (Object.keys(activeFilters).length > 0) {
        params.append('filters', JSON.stringify(activeFilters))
      }

      const url = `${API_BASE_URL}/api/data-import/public-download/${datasetId}/?${params.toString()}`
      const response = await fetch(url)

      if (!response.ok) throw new Error("Erro ao baixar arquivo")

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
              case "contains": return strValue.includes(filterVal)
              case "equals": return strValue === filterVal
              case "startsWith": return strValue.startsWith(filterVal)
              case "endsWith": return strValue.endsWith(filterVal)
              default: return true
            }
          case "number":
          case "integer":
          case "float":
            const numValue = parseFloat(String(cellValue))
            const numFilter = parseFloat(filter.value as string)
            if (isNaN(numFilter)) return true
            switch (filter.operator) {
              case "equals": return numValue === numFilter
              case "notEquals": return numValue !== numFilter
              case "greaterThan": return numValue > numFilter
              case "lessThan": return numValue < numFilter
              case "greaterThanOrEqual": return numValue >= numFilter
              case "lessThanOrEqual": return numValue <= numFilter
              case "between":
                const numFilter2 = parseFloat(filter.value2 || "")
                return !isNaN(numFilter2) && numValue >= numFilter && numValue <= numFilter2
              default: return true
            }
          case "boolean":
            if (filter.value === "all") return true
            return String(cellValue).toLowerCase() === filter.value
          case "category":
            const selectedValues = filter.value as string[]
            if (!selectedValues || selectedValues.length === 0) return true
            return selectedValues.some(val => String(cellValue).toLowerCase() === val.toLowerCase())
          case "date":
          case "datetime":
            const dateValue = new Date(String(cellValue))
            const filterDate = new Date(filter.value as string)
            if (isNaN(filterDate.getTime())) return true
            switch (filter.operator) {
              case "equals": return dateValue.toDateString() === filterDate.toDateString()
              case "before": return dateValue < filterDate
              case "after": return dateValue > filterDate
              case "between":
                const filterDate2 = new Date(filter.value2 || "")
                return !isNaN(filterDate2.getTime()) && dateValue >= filterDate && dateValue <= filterDate2
              default: return true
            }
          default: return true
        }
      })
    })
  }

  const displayData = applyFilters(filteredData)

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Header — parchment tile */}
      <div className="bg-[#f5f5f7]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-[80px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#7a7a7a] mb-4">
            Catálogo público
          </p>
          <h1 className="text-[56px] font-semibold text-[#1d1d1f] leading-[1.07] tracking-[-0.28px] mb-4">
            Datasets Públicos
          </h1>
          <p className="text-[28px] font-normal text-[#7a7a7a] leading-[1.14] tracking-[0.196px]">
            {datasets.length} {datasets.length === 1 ? 'dataset disponível' : 'datasets disponíveis'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-[48px]">
        {isLoadingDatasets ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#e0e0e0] border-t-[#0066cc] rounded-full animate-spin mr-4" />
            <span className="text-base font-bold text-[#000000]">Carregando datasets...</span>
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-[#a0a0a0]" />
            </div>
            <h3 className="text-[24px] font-bold text-[#000000] mb-2 tracking-[-0.02em]">
              Nenhum dataset disponível
            </h3>
            <p className="text-[#7a7a7a] text-sm">
              Não há datasets públicos no momento
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {datasets.map((dataset) => (
              <div key={dataset.id} onClick={() => handleDatasetClick(dataset)} className="cursor-pointer group">
                <Card className="border border-[#e0e0e0] rounded-[18px] h-full transition-colors duration-200 group-hover:border-[#0066cc]">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-[#f5f5f7] rounded-full flex items-center justify-center flex-shrink-0">
                        <Database className="h-5 w-5 text-[#000000]" />
                      </div>
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Ativo
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-[#000000] mb-3 line-clamp-2">
                        {dataset.table_name}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-[#7a7a7a]">
                          <Hash className="h-4 w-4 mr-2 text-[#a0a0a0]" />
                          <span className="font-bold text-[#000000]">{dataset.record_count.toLocaleString()}</span>
                          <span className="ml-1">registros</span>
                        </div>
                        <div className="flex items-center text-sm text-[#7a7a7a]">
                          <Columns3 className="h-4 w-4 mr-2 text-[#a0a0a0]" />
                          <span className="font-bold text-[#000000]">{Object.keys(dataset.column_structure || {}).length}</span>
                          <span className="ml-1">colunas</span>
                        </div>
                        <div className="flex items-center text-sm text-[#7a7a7a]">
                          <Calendar className="h-4 w-4 mr-2 text-[#a0a0a0]" />
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

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open)
        if (!open) setActiveFilters({})
      }}>
        <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[95vh] flex flex-col p-6 rounded-[18px] border-[#e0e0e0]">
          {selectedDataset && (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2 text-[#000000] font-bold text-xl tracking-[-0.02em]">
                  <Database className="h-5 w-5 text-[#000000]" />
                  {selectedDataset.table_name}
                </DialogTitle>
              </DialogHeader>

              <div className="flex-shrink-0 flex items-center justify-between py-3 border-b border-[#e0e0e0]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-[#a0a0a0]" />
                    <span className="text-sm text-[#7a7a7a]">Registros:</span>
                    <span className="font-bold text-[#000000]">{selectedDataset.record_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Columns3 className="h-4 w-4 text-[#a0a0a0]" />
                    <span className="text-sm text-[#7a7a7a]">Colunas:</span>
                    <span className="font-bold text-[#000000]">{Object.keys(selectedDataset.column_structure || {}).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#a0a0a0]" />
                    <span className="text-sm text-[#7a7a7a]">Criado em:</span>
                    <span className="font-bold text-[#000000]">{new Date(selectedDataset.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={downloadFormat} onValueChange={setDownloadFormat}>
                    <SelectTrigger className="w-[100px] rounded-full border-[#e0e0e0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[16px]">
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleDownload(selectedDataset.id, selectedDataset.table_name)}
                    variant="default"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto mt-4">
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[#e0e0e0] border-t-[#0066cc] rounded-full animate-spin mr-3" />
                    <span className="text-[17px] font-semibold text-[#1d1d1f] tracking-[-0.374px]">Carregando dados...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#f5f5f7]">
                          <TableHead className="w-[50px] font-bold text-[#000000] sticky top-0 bg-[#f5f5f7]">
                            <Checkbox
                              checked={selectedColumns.length === Object.keys(selectedDataset.column_structure || {}).length}
                              onCheckedChange={toggleAllColumns}
                            />
                          </TableHead>
                          {columnMetadata
                            .filter(col => selectedColumns.includes(col.name))
                            .map((column) => (
                              <TableHead key={column.name} className="font-bold text-[#000000] sticky top-0 bg-[#f5f5f7] min-w-[150px]">
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
                                        return { ...prev, [column.name]: value }
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
                            <TableCell colSpan={selectedColumns.length + 1} className="text-center py-12 text-[#a0a0a0]">
                              Nenhum registro encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayData.map((row, idx) => (
                            <TableRow key={idx} className="hover:bg-[#f5f5f7] transition-colors">
                              <TableCell className="text-[#a0a0a0] font-mono text-sm">
                                {idx + 1}
                              </TableCell>
                              {columnMetadata
                                .filter(col => selectedColumns.includes(col.name))
                                .map((column) => (
                                  <TableCell key={column.name} className="text-[#000000]">
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
