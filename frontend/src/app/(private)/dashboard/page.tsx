"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import {
  Database,
  HardDrive,
  TrendingUp,
  Maximize2,
  X,
  FileText
} from "lucide-react"
import { getDashboardStats, type DashboardStats } from "@/lib/dashboard-service"

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
  height = 350
}: ChartCardProps) {
  const isFullscreen = chartStates[chartKey]?.fullscreen || false

  return (
    <Card className="border-[#e0e0e0] rounded-[18px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-[#000000]">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm mt-1 text-[#6b6b6b]">{description}</CardDescription>
            )}
          </div>
          <Dialog open={isFullscreen} onOpenChange={() => onToggleFullscreen(chartKey)}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFullscreen(chartKey)}
              className="h-9 w-9 text-[#6b6b6b] hover:text-[#000000] border-0"
              title="Visualizar em tela cheia"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <DialogContent
              className="!max-w-none !w-screen !h-screen !p-0 !m-0 !rounded-none !border-0 !bg-white !top-0 !left-0 !translate-x-0 !translate-y-0 !fixed !inset-0 !z-50"
              showCloseButton={false}
            >
              <div className="h-screen w-screen flex flex-col bg-[#ffffff]">
                <div className="flex-shrink-0 p-6 pb-4 border-b border-[#e0e0e0] bg-[#ffffff]">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-[34px] font-semibold text-[#1d1d1f] leading-[1.47] tracking-[-0.374px]">{title}</DialogTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleFullscreen(chartKey)}
                      title="Fechar tela cheia"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 p-8 overflow-hidden bg-[#f5f5f7]">
                  <div className="h-full bg-[#ffffff] border border-[#e0e0e0] rounded-[18px] p-8">
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
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <>{children}</>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [chartStates, setChartStates] = useState<ChartStates>({})
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleFullscreen = (chartKey: string) => {
    setChartStates(prev => ({
      ...prev,
      [chartKey]: { fullscreen: !(prev[chartKey]?.fullscreen || false) }
    }))
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const stats = await getDashboardStats()
        setDashboardData(stats)
        setError(null)
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        setError("Erro ao carregar dados do dashboard")
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="bg-[#f5f5f7] px-8 py-6 border-b border-[#e0e0e0] mb-8">
          <div className="h-9 bg-[#1d1d1f]/8 rounded-[8px] w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-[#1d1d1f]/5 rounded-[8px] w-64 animate-pulse mt-3" />
        </div>
        <div className="px-8">
          <div className="grid gap-5 md:grid-cols-3 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-[#e0e0e0] rounded-[18px] p-6 animate-pulse">
                <div className="space-y-3">
                  <div className="h-3 bg-[#1d1d1f]/8 rounded-full w-1/2" />
                  <div className="h-10 bg-[#1d1d1f]/8 rounded-full w-3/4" />
                  <div className="h-3 bg-[#1d1d1f]/5 rounded-full w-1/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="border border-[#e0e0e0] rounded-[18px] p-6 animate-pulse">
            <div className="h-4 bg-[#1d1d1f]/8 rounded-full w-48 mb-6" />
            <div className="h-64 bg-[#f5f5f7] rounded-[8px]" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8">
        <div className="border border-[#cc0000] bg-[#cc0000]/5 p-6 rounded-[18px]">
          <p className="text-[#cc0000] font-bold">{error || "Erro ao carregar dados"}</p>
        </div>
      </div>
    )
  }

  const { metrics, monthly_volume } = dashboardData

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page header — parchment sub-nav strip */}
      <div className="bg-[#f5f5f7] px-8 py-6 border-b border-[#e0e0e0]">
        <h1 className="text-[34px] font-semibold text-[#1d1d1f] leading-[1.47] tracking-[-0.374px]">
          Dashboard
        </h1>
        <p className="text-[17px] text-[#7a7a7a] mt-1 leading-[1.47] tracking-[-0.374px]">Visão geral do sistema DataDock</p>
      </div>

      <div className="p-8">
        {/* Metric cards */}
        <div className="grid gap-5 md:grid-cols-3 mb-8">
          {/* Datasets Ativos */}
          <div className="border border-[#e0e0e0] rounded-[18px] p-6 bg-[#ffffff]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#7a7a7a] mb-3">
                  Datasets Ativos
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-semibold text-[#1d1d1f]">{metrics.active_datasets}</span>
                  {metrics.growth_rate > 0 && (
                    <span className="flex items-center text-sm text-[#1ea64a] font-semibold">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +{metrics.growth_rate}%
                    </span>
                  )}
                </div>
                <p className="text-[14px] text-[#7a7a7a] mt-3 tracking-[-0.224px]">vs. mês anterior</p>
              </div>
              <div className="w-11 h-11 bg-[#f5f5f7] rounded-[8px] flex items-center justify-center flex-shrink-0">
                <Database className="h-5 w-5 text-[#0066cc]" />
              </div>
            </div>
          </div>

          {/* Registros Totais */}
          <div className="border border-[#e0e0e0] rounded-[18px] p-6 bg-[#ffffff]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#7a7a7a] mb-3">
                  Registros Totais
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-semibold text-[#1d1d1f]">
                    {metrics.total_records >= 1000000
                      ? `${(metrics.total_records / 1000000).toFixed(1)}M`
                      : metrics.total_records >= 1000
                      ? `${(metrics.total_records / 1000).toFixed(1)}K`
                      : metrics.total_records}
                  </span>
                  {metrics.growth_rate > 0 && (
                    <span className="flex items-center text-sm text-[#1ea64a] font-semibold">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +{metrics.growth_rate}%
                    </span>
                  )}
                </div>
                <p className="text-[14px] text-[#7a7a7a] mt-3 tracking-[-0.224px]">vs. mês anterior</p>
              </div>
              <div className="w-11 h-11 bg-[#f5f5f7] rounded-[8px] flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-[#0066cc]" />
              </div>
            </div>
          </div>

          {/* Armazenamento */}
          <div className="border border-[#e0e0e0] rounded-[18px] p-6 bg-[#ffffff]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#7a7a7a] mb-3">
                  Armazenamento
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-semibold text-[#1d1d1f]">{metrics.storage_tb.toFixed(2)}</span>
                  <span className="text-lg font-semibold text-[#7a7a7a]">TB</span>
                </div>
                <p className="text-[14px] text-[#7a7a7a] mt-3 tracking-[-0.224px]">{metrics.storage_percent}% utilizado do total</p>
              </div>
              <div className="w-11 h-11 bg-[#f5f5f7] rounded-[8px] flex items-center justify-center flex-shrink-0">
                <HardDrive className="h-5 w-5 text-[#0066cc]" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart section */}
        <div>
          <div className="mb-5">
            <h2 className="text-[21px] font-semibold text-[#1d1d1f] leading-[1.19] tracking-[0.231px]">
              Volume de Dados Mensal
            </h2>
            <p className="text-[17px] text-[#7a7a7a] mt-1 leading-[1.47] tracking-[-0.374px]">
              Evolução do volume de dados armazenados ao longo dos meses (em GB)
            </p>
          </div>

          <ChartCard
            title="Volume de Dados Mensal"
            chartKey="monthlyVolume"
            chartStates={chartStates}
            onToggleFullscreen={toggleFullscreen}
            height={300}
          >
            <AreaChart data={monthly_volume}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0066cc" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#0066cc" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeWidth={1} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#7a7a7a" }}
                stroke="#f0f0f0"
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                tick={{ fontSize: 12, fill: "#7a7a7a" }}
                stroke="#f0f0f0"
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  padding: "10px 14px",
                  color: "#1d1d1f",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                }}
                formatter={(value: number) => [`${value} GB`, "Volume Total"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0066cc"
                strokeWidth={2}
                fill="url(#colorVolume)"
                dot={{ fill: "#0066cc", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#0066cc" }}
              />
            </AreaChart>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
