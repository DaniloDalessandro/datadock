"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search, Download, Database, Loader2, Table2, Calendar, Hash,
  Columns3, ArrowRight, Filter, Github, Linkedin, Mail
} from "lucide-react"
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

// Interfaces
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

interface SearchResponse {
  success: boolean
  results?: SearchResult[]
  error?: string
}

interface PublicDataResponse {
  success: boolean
  process_id: number
  table_name: string
  columns: string[]
  data: Record<string, string | number | boolean>[]
  count: number
  error?: string
}

export default function SitePublicoPage() {
  const [searchQuery, setSearchQuery] = useState("")
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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredDatasets, setFilteredDatasets] = useState<PublicDataset[]>([])
  const [showAllDatasets, setShowAllDatasets] = useState(false)
  const dataSearchSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE_URL}/api/data-import/public-datasets/`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) setDatasets(data.results || [])
        }
      } catch (error) {
        console.error("Error fetching datasets:", error)
      } finally {
        setIsLoadingDatasets(false)
      }
    }
    fetchDatasets()
  }, [])

  const handleGetStartedClick = () => {
    dataSearchSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      const filtered = datasets.filter(d => d.table_name.toLowerCase().includes(value.toLowerCase()))
      setFilteredDatasets(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredDatasets([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (dataset: PublicDataset) => {
    setShowSuggestions(false)
    setSearchQuery(dataset.table_name)
    handleCardClick(dataset)
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setShowSuggestions(false)
    if (!searchQuery.trim()) {
      toast.error("Digite um termo de busca")
      return
    }
    setIsSearching(true)
    setIsModalOpen(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/data-import/public-search/?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('Erro ao buscar dados')
      const data: SearchResponse = await response.json()
      if (data.success) {
        setSearchResults(data.results || [])
        if (data.results && data.results.length === 0) toast.info("Nenhum resultado encontrado")
      } else {
        toast.error(data.error || "Erro ao buscar dados")
        setSearchResults([])
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar dados"
      toast.error(errorMessage)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleDownload = async (processId: number, tableName: string) => {
    if (selectedColumns.length === 0) {
      toast.error("Selecione pelo menos uma coluna para baixar")
      return
    }
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Monta os parâmetros da URL
      const params = new URLSearchParams()
      params.append('file_format', downloadFormat)
      params.append('columns', selectedColumns.join(','))

      // Adiciona filtros se existirem
      if (Object.keys(activeFilters).length > 0) {
        params.append('filters', JSON.stringify(activeFilters))
        console.log('[DOWNLOAD] Enviando filtros:', activeFilters)
      } else {
        console.log('[DOWNLOAD] Nenhum filtro aplicado')
      }

      const url = `${API_BASE_URL}/api/data-import/public-download/${processId}/?${params.toString()}`
      console.log('[DOWNLOAD] URL:', url)

      const response = await fetch(url)
      if (!response.ok) throw new Error('Erro ao baixar dados')

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${tableName}.${downloadFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      const filterInfo = Object.keys(activeFilters).length > 0
        ? ` (${filteredData.length} registros filtrados)`
        : ''
      toast.success(`Download iniciado!${filterInfo}`)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao baixar dados"
      toast.error(errorMessage)
    }
  }

  const toggleColumn = (column: string) => {
    setSelectedColumns(p => p.includes(column) ? p.filter(c => c !== column) : [...p, column])
  }

  const toggleAllColumns = (columns: string[]) => {
    setSelectedColumns(p => p.length === columns.length ? [] : columns)
  }

  const handleCardClick = async (dataset: PublicDataset) => {
    setSelectedDataset(dataset)
    setSearchResults([])
    setColumnMetadata([])
    setActiveFilters({})
    setFilteredData([])
    setIsModalOpen(true)
    setIsSearching(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const [dataResponse, metadataResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/data-import/public-data/${dataset.id}/`),
        fetch(`${API_BASE_URL}/api/data-import/public-metadata/${dataset.id}/`)
      ])
      if (!dataResponse.ok) throw new Error('Erro ao buscar dados')
      const data: PublicDataResponse = await dataResponse.json()
      const metadata = metadataResponse.ok ? await metadataResponse.json() : null

      if (data.success) {
        setSearchResults([{
          process_id: data.process_id,
          table_name: data.table_name,
          columns: data.columns,
          data: data.data,
          count: data.count
        }])
        setFilteredData(data.data)
        setSelectedColumns(data.columns)
        if (metadata?.success) {
          setColumnMetadata(metadata.columns || [])
        }
      } else {
        toast.error(data.error || "Erro ao buscar dados")
        setSearchResults([])
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar dados"
      toast.error(errorMessage)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const applyFilters = (data: Record<string, string | number | boolean>[], filters: Record<string, FilterValue>) => {
    if (Object.keys(filters).length === 0) return data

    return data.filter(row => {
      return Object.entries(filters).every(([columnName, filter]) => {
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

  const handleFilterChange = (column: string, filter: FilterValue | null) => {
    const newFilters = { ...activeFilters }
    if (filter) newFilters[column] = filter
    else delete newFilters[column]
    setActiveFilters(newFilters)
    if (searchResults[0]?.data) {
      setFilteredData(applyFilters(searchResults[0].data, newFilters))
    }
  }

  const getColumnMetadata = (columnName: string) => columnMetadata.find(c => c.name === columnName)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="relative max-w-7xl mx-auto px-4 py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Database className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              DataDock
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-12">
              Plataforma completa para exploração, análise e download de dados públicos
            </p>
            <div className="flex justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50 rounded-full px-10 py-6 text-lg font-semibold shadow-xl"
                onClick={handleGetStartedClick}
              >
                Explorar Datasets
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Recursos Poderosos
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Ferramentas intuitivas e poderosas para trabalhar com dados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-500 hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="inline-flex p-4 bg-blue-100 rounded-2xl mb-4">
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Busca Avançada</h3>
                <p className="text-slate-600">
                  Encontre rapidamente os dados que você precisa com nossa poderosa engine de busca
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-500 hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="inline-flex p-4 bg-purple-100 rounded-2xl mb-4">
                  <Filter className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Filtros Dinâmicos</h3>
                <p className="text-slate-600">
                  Refine seus dados com filtros avançados para cada coluna
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-500 hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="inline-flex p-4 bg-green-100 rounded-2xl mb-4">
                  <Download className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Múltiplos Formatos</h3>
                <p className="text-slate-600">
                  Baixe seus dados em CSV ou XLSX para fácil integração
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Data Exploration Section */}
      <section ref={dataSearchSectionRef} className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Explore os Datasets
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Pesquise por termo ou selecione um dataset da lista abaixo
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto mb-16">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar datasets..."
                value={searchQuery}
                onChange={e => handleSearchInputChange(e.target.value)}
                onFocus={() => searchQuery.trim() && filteredDatasets.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full h-16 pl-14 pr-32 text-lg rounded-2xl border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 shadow-lg"
              />
              <Button
                type="submit"
                disabled={isSearching}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Buscar"}
              </Button>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                  {filteredDatasets.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleSuggestionClick(d)}
                      className="w-full px-6 py-4 text-left hover:bg-blue-50 flex items-center gap-4 border-b last:border-b-0 transition-colors"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Table2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{d.table_name}</p>
                        <p className="text-sm text-slate-600">{d.record_count.toLocaleString()} registros</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Datasets Grid */}
          {isLoadingDatasets ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Database className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg">Nenhum dataset disponível</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(showAllDatasets ? datasets : datasets.slice(0, 6)).map(d => (
                  <Card
                    key={d.id}
                    className="group hover:shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-blue-500"
                    onClick={() => handleCardClick(d)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                          <Table2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-slate-900 mb-1 truncate">{d.table_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Hash className="h-4 w-4" />
                            <span>{d.record_count.toLocaleString()} registros</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>Atualizado em {new Date(d.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {datasets.length > 6 && (
                <div className="text-center mt-12">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowAllDatasets(p => !p)}
                    className="rounded-full px-8 border-2"
                  >
                    {showAllDatasets ? "Mostrar Menos" : `Mostrar Mais ${datasets.length - 6} Datasets`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-6 w-6" />
                <span className="text-xl font-bold">DataDock</span>
              </div>
              <p className="text-slate-400">
                Plataforma completa para exploração e análise de dados públicos
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Busca Avançada</li>
                <li>Filtros Dinâmicos</li>
                <li>Download de Dados</li>
                <li>API Pública</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Documentação</li>
                <li>Tutoriais</li>
                <li>FAQ</li>
                <li>Contato</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Conecte-se</h4>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2024 DataDock. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal for Dataset Details */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open)
        if (!open) {
          setSearchResults([])
          setSelectedDataset(null)
        }
      }}>
        <DialogContent className="!max-w-[96vw] !w-[96vw] !h-[96vh] flex flex-col p-0 gap-0">
          {isSearching ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
          ) : selectedDataset && searchResults[0] && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                  {selectedDataset.table_name}
                </DialogTitle>
              </DialogHeader>

              <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-slate-50">
                <div className="flex gap-6 text-sm text-slate-600">
                  <span className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    {selectedDataset.record_count.toLocaleString()} registros
                  </span>
                  <span className="flex items-center gap-2">
                    <Columns3 className="h-4 w-4" />
                    {Object.keys(selectedDataset.column_structure || {}).length} colunas
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedDataset.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Select value={downloadFormat} onValueChange={setDownloadFormat}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleDownload(selectedDataset.id, selectedDataset.table_name)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto min-h-0">
                <div className="w-full">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="w-12 bg-white">
                          <Checkbox
                            checked={selectedColumns.length === searchResults[0].columns.length}
                            onCheckedChange={() => toggleAllColumns(searchResults[0].columns)}
                          />
                        </TableHead>
                        {searchResults[0].columns.map(col => {
                          const colMeta = getColumnMetadata(col)
                          return (
                            <TableHead key={col} className="font-semibold bg-white whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={selectedColumns.includes(col)}
                                  onCheckedChange={() => toggleColumn(col)}
                                />
                                <span>{col}</span>
                                {colMeta && (
                                  <ColumnFilterPopover
                                    column={col}
                                    columnType={colMeta.filter_type}
                                    uniqueValues={colMeta.unique_values}
                                    value={activeFilters[col]}
                                    onChange={filter => handleFilterChange(col, filter)}
                                    isActive={!!activeFilters[col]}
                                  />
                                )}
                              </div>
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((row, i) => (
                        <TableRow key={i} className="hover:bg-slate-50">
                          <TableCell className="text-center text-xs text-slate-400">{i + 1}</TableCell>
                          {searchResults[0].columns.map(col => (
                            <TableCell key={col} className="text-sm whitespace-nowrap">
                              {String(row[col] ?? '-')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {Object.keys(activeFilters).length > 0 && (
                <div className="text-sm text-slate-600 px-6 py-3 border-t bg-slate-50 shrink-0">
                  Mostrando {filteredData.length} de {searchResults[0].data.length} registros
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
