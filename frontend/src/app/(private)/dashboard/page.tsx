"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  Database,
  HardDrive,
  TrendingUp,
  Clock,
  Maximize2,
  X,
  FileText,
  RefreshCw,
  Eye,
  Columns3,
  Calendar,
  Hash,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardStats, type DashboardStats } from "@/lib/dashboard-service"
import { apiGet } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"

interface PrivateDataset {
  id: number
  table_name: string
  status: string
  status_display: string
  record_count: number
  column_structure: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface ChartStates {
  [key: string]: { fullscreen: boolean }
}

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  chartKey: string
  chartStates: ChartStates
  onToggleFullscreen: (chartKey: string) => void
  height?: number
}

function ChartCard({
  title,
  description,
  children,
  chartKey,
  chartStates,
  onToggleFullscreen,
  height = 300,
}: ChartCardProps) {
  const isFullscreen = chartStates[chartKey]?.fullscreen || false

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-900">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            )}
          </div>
          <Dialog open={isFullscreen} onOpenChange={() => onToggleFullscreen(chartKey)}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFullscreen(chartKey)}
              className="h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              title="Tela cheia"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <DialogContent
              className="!max-w-none !w-screen !h-screen !p-0 !m-0 !rounded-none !border-0 !bg-white !top-0 !left-0 !translate-x-0 !translate-y-0 !fixed !inset-0 !z-50"
              showCloseButton={false}
            >
              <div className="h-screen w-screen flex flex-col bg-gray-50">
                <div className="flex-shrink-0 px-6 py-4 border-b bg-white">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-semibold text-gray-900">
                      {title}
                    </DialogTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleFullscreen(chartKey)}
                      className="h-9 w-9 text-gray-500 hover:text-gray-900 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 p-8 overflow-hidden">
                  <div className="h-full bg-white rounded-xl shadow border border-gray-200 p-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <>{children}</>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={height}>
          <>{children}</>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function getStatusColors(status: string): string {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    inactive: "bg-gray-100 text-gray-600 border-gray-200",
    processing: "bg-blue-100 text-blue-700 border-blue-200",
    pending: "bg-orange-100 text-orange-700 border-orange-200",
    error: "bg-red-100 text-red-700 border-red-200",
  }
  return map[status] || map.inactive
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString("pt-BR")
}

function StatSkeleton() {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-6">
        <div className="animate-pulse space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [chartStates, setChartStates] = useState<ChartStates>({})
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [recentDatasets, setRecentDatasets] = useState<PrivateDataset[]>([])
  const [topDatasets, setTopDatasets] = useState<{ name: string; records: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const toggleFullscreen = (chartKey: string) => {
    setChartStates((prev) => ({
      ...prev,
      [chartKey]: { fullscreen: !(prev[chartKey]?.fullscreen || false) },
    }))
  }

  const fetchAll = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true)
      const [stats, datasetsRes] = await Promise.all([
        getDashboardStats(),
        apiGet("/api/data-import/processes/?page_size=100") as Promise<{
          results: PrivateDataset[]
        }>,
      ])
      setDashboardData(stats)
      const list: PrivateDataset[] = datasetsRes.results || []
      const sorted = [...list].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      setRecentDatasets(sorted.slice(0, 10))
      const top10 = [...list]
        .sort((a, b) => b.record_count - a.record_count)
        .slice(0, 10)
        .map((d) => ({
          name: d.table_name.length > 20 ? d.table_name.slice(0, 18) + "…" : d.table_name,
          records: d.record_count,
        }))
      setTopDatasets(top10)
      setError(null)
      setLastUpdated(new Date())
      if (showToast) toast.success("Dashboard atualizado!")
    } catch (err) {
      console.error("Error loading dashboard:", err)
      setError("Erro ao carregar dados do dashboard")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    autoRefreshRef.current = setInterval(() => fetchAll(), 30000)
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [fetchAll])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-32 mb-1.5" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <Skeleton className="h-4 w-32 mb-4" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600 text-sm">{error || "Erro ao carregar dados"}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => fetchAll()}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { metrics, dataset_status, monthly_volume } = dashboardData

  const TOOLTIP_STYLE = {
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "12px",
    padding: "8px 12px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  }

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-300">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral do sistema DataDock</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              {lastUpdated.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => fetchAll(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/60 to-white hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Datasets Ativos</p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <h3 className="text-3xl font-bold text-gray-900">{metrics.active_datasets}</h3>
                  {metrics.growth_rate > 0 && (
                    <span className="flex items-center text-xs text-green-600 font-medium">
                      <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                      +{metrics.growth_rate}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">vs. mês anterior</p>
              </div>
              <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Database className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/60 to-white hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registros Totais</p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {formatNumber(metrics.total_records)}
                  </h3>
                  {metrics.growth_rate > 0 && (
                    <span className="flex items-center text-xs text-green-600 font-medium">
                      <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                      +{metrics.growth_rate}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">vs. mês anterior</p>
              </div>
              <div className="h-14 w-14 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/60 to-white hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Armazenamento</p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {metrics.storage_tb.toFixed(2)}
                  </h3>
                  <span className="text-base text-gray-500">TB</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {metrics.storage_percent}% do total utilizado
                </p>
              </div>
              <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <HardDrive className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly volume – takes 2 cols */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Volume de Dados Mensal"
            description="Evolução do volume armazenado ao longo dos meses (GB)"
            chartKey="monthlyVolume"
            chartStates={chartStates}
            onToggleFullscreen={toggleFullscreen}
            height={250}
          >
            <AreaChart data={monthly_volume}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                stroke="#e5e7eb"
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                stroke="#e5e7eb"
                tickLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number) => [`${v} GB`, "Volume"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#colorVolume)"
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ChartCard>
        </div>

        {/* Pie chart – 1 col */}
        <ChartCard
          title="Distribuição por Status"
          description="Datasets agrupados por status atual"
          chartKey="statusPie"
          chartStates={chartStates}
          onToggleFullscreen={toggleFullscreen}
          height={250}
        >
          <PieChart>
            <Pie
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data={dataset_status as any[]}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {dataset_status.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number, name: string) => [v, name]}
            />
            <Legend
              iconSize={8}
              iconType="circle"
              formatter={(value) => (
                <span style={{ fontSize: 11, color: "#6b7280" }}>{value}</span>
              )}
            />
          </PieChart>
        </ChartCard>
      </div>

      {/* Top datasets bar chart */}
      {topDatasets.length > 0 && (
        <ChartCard
          title="Top 10 Datasets por Volume de Registros"
          description="Datasets com maior número de registros"
          chartKey="topDatasets"
          chartStates={chartStates}
          onToggleFullscreen={toggleFullscreen}
          height={240}
        >
          <BarChart data={topDatasets} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis
              type="number"
              tickFormatter={(v) => formatNumber(v)}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              stroke="#e5e7eb"
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              stroke="#e5e7eb"
              tickLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [v.toLocaleString("pt-BR"), "Registros"]}
            />
            <Bar dataKey="records" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ChartCard>
      )}

      {/* Recent datasets table */}
      {recentDatasets.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-900">
                  Datasets Recentes
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Últimos 10 datasets atualizados
                </CardDescription>
              </div>
              <Link href="/datasets">
                <Button variant="ghost" size="sm" className="text-xs h-7 text-blue-600 hover:text-blue-700">
                  Ver todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="py-2.5 px-4 text-xs font-semibold text-gray-600">
                      Nome
                    </TableHead>
                    <TableHead className="py-2.5 px-4 text-xs font-semibold text-gray-600">
                      Status
                    </TableHead>
                    <TableHead className="py-2.5 px-4 text-xs font-semibold text-gray-600 text-right">
                      Registros
                    </TableHead>
                    <TableHead className="py-2.5 px-4 text-xs font-semibold text-gray-600 text-right">
                      Colunas
                    </TableHead>
                    <TableHead className="py-2.5 px-4 text-xs font-semibold text-gray-600">
                      Atualizado
                    </TableHead>
                    <TableHead className="py-2.5 px-4 text-xs font-semibold text-gray-600 text-right">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDatasets.map((ds) => (
                    <TableRow key={ds.id} className="hover:bg-gray-50">
                      <TableCell className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-50 p-1 rounded flex-shrink-0">
                            <Database className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                            {ds.table_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColors(ds.status)}`}
                        >
                          {ds.status_display || ds.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-sm text-gray-700 text-right">
                        <span className="flex items-center justify-end gap-1">
                          <Hash className="h-3 w-3 text-gray-400" />
                          {ds.record_count.toLocaleString("pt-BR")}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-sm text-gray-700 text-right">
                        <span className="flex items-center justify-end gap-1">
                          <Columns3 className="h-3 w-3 text-gray-400" />
                          {Object.keys(ds.column_structure || {}).length}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(ds.updated_at).toLocaleDateString("pt-BR")}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Abrir dataset"
                          onClick={() => window.open(`/datasets/${ds.id}`, "_blank")}
                        >
                          <Eye className="h-3.5 w-3.5 text-gray-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
