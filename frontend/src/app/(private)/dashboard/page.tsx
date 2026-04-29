"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
  TrendingDown,
  Clock,
  Maximize2,
  X,
  FileText,
  RefreshCw,
  Eye,
  Columns3,
  Calendar,
  Hash,
  BarChart3,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
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

/* ─── Design tokens — Airbnb Rausch palette ─────────────────────────── */
const CHART_COLORS = {
  primary: "#ff385c",
  accent: "#e00b41",
  success: "#27a644",
  successAlt: "#10b981",
  muted: "#dddddd",
  text: "#6a6a6a",
  grid: "#ebebeb",
}

const PIE_COLORS = ["#ff385c", "#e00b41", "#6a6a6a", "#222222", "#dddddd"]

/* ─── Tooltip style — light surface ─────────────────────────────────── */
const TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #dddddd",
  borderRadius: "8px",
  fontSize: "12px",
  padding: "8px 12px",
  color: "#222222",
  boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px",
}

/* ─── Dark tooltip style ─────────────────────────────────────────────── */
// Used at runtime based on the resolved theme
function getTooltipStyle(isDark: boolean) {
  if (isDark) {
    return {
      backgroundColor: "#191a1b",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "8px",
      fontSize: "12px",
      padding: "8px 12px",
      color: "#d0d6e0",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }
  }
  return TOOLTIP_STYLE
}

/* ─── ChartCard ─────────────────────────────────────────────────────────── */
function ChartCard({
  title,
  description,
  children,
  chartKey,
  chartStates,
  onToggleFullscreen,
  height = 240,
}: ChartCardProps) {
  const isFullscreen = chartStates[chartKey]?.fullscreen || false

  return (
    <div
      className="rounded-[14px] transition-all duration-200 bg-white dark:bg-[#191a1b] border border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-0">
        <div>
          <p className="text-sm leading-snug font-semibold text-[#222222] dark:text-[#f7f8f8]">
            {title}
          </p>
          {description && (
            <p className="text-xs mt-0.5 text-[#6a6a6a] dark:text-[#8a8f98]">
              {description}
            </p>
          )}
        </div>
        <Dialog open={isFullscreen} onOpenChange={() => onToggleFullscreen(chartKey)}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFullscreen(chartKey)}
            className="h-7 w-7 rounded-[8px] transition-colors duration-150 flex-shrink-0 text-[#929292] hover:text-[#222222] hover:bg-[#f7f7f7] dark:text-[#62666d] dark:hover:text-[#d0d6e0] dark:hover:bg-[rgba(255,255,255,0.06)]"
            title="Tela cheia"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>

          {/* Fullscreen dialog */}
          <DialogContent
            className="!max-w-none !w-screen !h-screen !p-0 !m-0 !rounded-none !border-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !fixed !inset-0 !z-50 !shadow-none bg-[#f7f7f7] dark:!bg-[#0f1011]"
            showCloseButton={false}
          >
            <div className="h-screen w-screen flex flex-col">
              {/* Dialog header */}
              <div className="flex-shrink-0 px-8 py-5 bg-white dark:bg-[#191a1b] border-b border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="font-semibold text-[16px] text-[#222222] dark:text-[#f7f8f8]">
                      {title}
                    </DialogTitle>
                    {description && (
                      <p className="text-xs mt-0.5 text-[#6a6a6a] dark:text-[#8a8f98]">
                        {description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onToggleFullscreen(chartKey)}
                    className="h-8 w-8 rounded-[8px]"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 p-8 overflow-hidden">
                <div className="h-full rounded-[14px] p-8 bg-white dark:bg-[#191a1b] border border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <>{children}</>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chart body */}
      <div className="px-2 pb-5 pt-4">
        <ResponsiveContainer width="100%" height={height}>
          <>{children}</>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString("pt-BR")
}

/* ─── KPI Card Skeleton ─────────────────────────────────────────────────── */
function StatSkeleton() {
  return (
    <div className="rounded-[14px] p-6 bg-white dark:bg-[#191a1b] border border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]" style={{ minHeight: "100px" }}>
      <div className="animate-pulse space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-28 bg-[#f2f2f2] dark:bg-[rgba(255,255,255,0.06)] rounded-[4px]" />
          <Skeleton className="h-7 w-7 rounded-[8px] bg-[#f2f2f2] dark:bg-[rgba(255,255,255,0.06)]" />
        </div>
        <Skeleton className="h-8 w-20 mt-2 bg-[#f2f2f2] dark:bg-[rgba(255,255,255,0.06)] rounded-[4px]" />
        <Skeleton className="h-3 w-16 bg-[#ebebeb] dark:bg-[rgba(255,255,255,0.04)] rounded-[4px]" />
      </div>
    </div>
  )
}

/* ─── Chart Skeleton ────────────────────────────────────────────────────── */
function ChartSkeleton() {
  return (
    <div className="rounded-[14px] p-6 bg-white dark:bg-[#191a1b] border border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]" style={{ minHeight: "280px" }}>
      <div className="animate-pulse">
        <Skeleton className="h-4 w-40 mb-1 bg-[#f2f2f2] dark:bg-[rgba(255,255,255,0.06)] rounded-[4px]" />
        <Skeleton className="h-3 w-56 mb-5 bg-[#ebebeb] dark:bg-[rgba(255,255,255,0.04)] rounded-[4px]" />
        <Skeleton className="w-full h-[196px] bg-[#f2f2f2] dark:bg-[rgba(255,255,255,0.06)] rounded-[8px]" />
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
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

  /* ─── Loading state ─────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex flex-col animate-in fade-in duration-300" style={{ padding: "24px 32px 32px", gap: "24px" }}>
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-28 bg-[#f2f2f2] dark:bg-[rgba(255,255,255,0.06)] rounded-[4px]" />
            <Skeleton className="h-3.5 w-44 bg-[#ebebeb] dark:bg-[rgba(255,255,255,0.04)] rounded-[4px]" />
          </div>
          <Skeleton className="h-9 w-28 rounded-[8px] bg-[#f2f2f2] dark:bg-[rgba(255,255,255,0.06)]" />
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <StatSkeleton /><StatSkeleton /><StatSkeleton />
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
      </div>
    )
  }

  /* ─── Error state ───────────────────────────────────────────────────── */
  if (error || !dashboardData) {
    return (
      <div className="flex flex-col gap-6" style={{ padding: "24px 32px 32px" }}>
        <div className="rounded-[14px] p-6 bg-[rgba(193,53,21,0.04)] dark:bg-[rgba(239,68,68,0.05)] border border-[rgba(193,53,21,0.15)] dark:border-[rgba(239,68,68,0.2)]">
          <p className="text-sm font-medium mb-3 text-[#c13515] dark:text-[#ef4444]">
            {error || "Erro ao carregar dados"}
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchAll()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const { metrics, dataset_status, monthly_volume } = dashboardData

  return (
    <div className="flex flex-col animate-in fade-in duration-300" style={{ padding: "24px 32px 32px", gap: "24px" }}>
      {/* ─── Page header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{
              color: "#222222",
              fontWeight: 700,
              fontSize: "24px",
              letterSpacing: "-0.288px",
              lineHeight: "1.2",
            }}
            className="dark:text-[#f7f8f8]"
          >
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-[#6a6a6a] dark:text-[#8a8f98]">
            Visão geral da plataforma
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-refresh indicator */}
          <span className="hidden sm:flex items-center gap-1.5 text-[#929292] dark:text-[#62666d] text-xs">
            <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse bg-[#27a644]" />
            Auto-refresh
          </span>

          {/* Last updated timestamp */}
          {lastUpdated && (
            <span className="hidden sm:block text-xs text-[#929292] dark:text-[#62666d]">
              Atualizado em{" "}
              {lastUpdated.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fetchAll(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* ─── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">

        {/* Datasets Ativos */}
        <div
          className="rounded-[14px] transition-all duration-200 cursor-default bg-white dark:bg-[#191a1b] border border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]"
          style={{ padding: "20px 24px" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[#929292] dark:text-[#62666d] text-xs font-medium uppercase tracking-[0.05em]">
              Datasets Ativos
            </span>
            <div
              className="flex items-center justify-center rounded-[8px] flex-shrink-0"
              style={{ width: "28px", height: "28px", background: "rgba(255,56,92,0.10)" }}
            >
              <Database style={{ width: "16px", height: "16px", color: "#ff385c" }} />
            </div>
          </div>

          <div
            className="mt-2 text-[#222222] dark:text-[#f7f8f8]"
            style={{ fontWeight: 700, fontSize: "28px", letterSpacing: "-0.5px", lineHeight: "1.1" }}
          >
            {metrics.active_datasets}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5">
            {metrics.growth_rate > 0 ? (
              <>
                <TrendingUp style={{ width: "12px", height: "12px", color: "#27a644" }} />
                <span style={{ color: "#27a644", fontSize: "12px", fontWeight: 500 }}>
                  +{metrics.growth_rate}%
                </span>
              </>
            ) : metrics.growth_rate < 0 ? (
              <>
                <TrendingDown style={{ width: "12px", height: "12px", color: "#c13515" }} />
                <span style={{ color: "#c13515", fontSize: "12px", fontWeight: 500 }}>
                  {metrics.growth_rate}%
                </span>
              </>
            ) : (
              <span className="text-[#929292] dark:text-[#62666d] text-xs">—</span>
            )}
            <span className="text-[#929292] dark:text-[#62666d] text-xs">vs mês anterior</span>
          </div>
        </div>

        {/* Registros Totais */}
        <div
          className="rounded-[14px] transition-all duration-200 cursor-default bg-white dark:bg-[#191a1b] border border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]"
          style={{ padding: "20px 24px" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[#929292] dark:text-[#62666d] text-xs font-medium uppercase tracking-[0.05em]">
              Registros Totais
            </span>
            <div
              className="flex items-center justify-center rounded-[8px] flex-shrink-0"
              style={{ width: "28px", height: "28px", background: "rgba(255,56,92,0.10)" }}
            >
              <BarChart3 style={{ width: "16px", height: "16px", color: "#ff385c" }} />
            </div>
          </div>

          <div
            className="mt-2 text-[#222222] dark:text-[#f7f8f8]"
            style={{ fontWeight: 700, fontSize: "28px", letterSpacing: "-0.5px", lineHeight: "1.1" }}
          >
            {formatNumber(metrics.total_records)}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5">
            {metrics.growth_rate > 0 ? (
              <>
                <TrendingUp style={{ width: "12px", height: "12px", color: "#27a644" }} />
                <span style={{ color: "#27a644", fontSize: "12px", fontWeight: 500 }}>
                  +{metrics.growth_rate}%
                </span>
              </>
            ) : metrics.growth_rate < 0 ? (
              <>
                <TrendingDown style={{ width: "12px", height: "12px", color: "#c13515" }} />
                <span style={{ color: "#c13515", fontSize: "12px", fontWeight: 500 }}>
                  {metrics.growth_rate}%
                </span>
              </>
            ) : (
              <span className="text-[#929292] dark:text-[#62666d] text-xs">—</span>
            )}
            <span className="text-[#929292] dark:text-[#62666d] text-xs">vs mês anterior</span>
          </div>
        </div>

        {/* Armazenamento */}
        <div
          className="rounded-[14px] transition-all duration-200 cursor-default bg-white dark:bg-[#191a1b] border border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]"
          style={{ padding: "20px 24px" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[#929292] dark:text-[#62666d] text-xs font-medium uppercase tracking-[0.05em]">
              Armazenamento
            </span>
            <div
              className="flex items-center justify-center rounded-[8px] flex-shrink-0"
              style={{ width: "28px", height: "28px", background: "rgba(39,166,68,0.10)" }}
            >
              <HardDrive style={{ width: "16px", height: "16px", color: "#27a644" }} />
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 mt-2">
            <span
              className="text-[#222222] dark:text-[#f7f8f8]"
              style={{ fontWeight: 700, fontSize: "28px", letterSpacing: "-0.5px", lineHeight: "1.1" }}
            >
              {metrics.storage_tb.toFixed(2)}
            </span>
            <span className="text-[#6a6a6a] dark:text-[#8a8f98] text-sm">TB</span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[#929292] dark:text-[#62666d] text-xs">
              {metrics.storage_percent}% do total utilizado
            </span>
          </div>
        </div>
      </div>

      {/* ─── Charts row ─────────────────────────────────────────────── */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">

        {/* Monthly volume area chart — 2 cols */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Volume de Dados Mensal"
            description="Evolução do volume armazenado ao longo dos meses (GB)"
            chartKey="monthlyVolume"
            chartStates={chartStates}
            onToggleFullscreen={toggleFullscreen}
            height={240}
          >
            <AreaChart data={monthly_volume}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff385c" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ff385c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ebebeb"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#929292" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                tick={{ fontSize: 11, fill: "#929292" }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number) => [`${v} GB`, "Volume"]}
                cursor={{ stroke: "#dddddd", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#ff385c"
                strokeWidth={2}
                fill="url(#colorVolume)"
                dot={false}
                activeDot={{ r: 4, fill: "#e00b41", strokeWidth: 0 }}
              />
            </AreaChart>
          </ChartCard>
        </div>

        {/* Status distribution pie chart — 1 col */}
        <ChartCard
          title="Distribuição por Status"
          description="Datasets agrupados por status atual"
          chartKey="statusPie"
          chartStates={chartStates}
          onToggleFullscreen={toggleFullscreen}
          height={240}
        >
          <PieChart>
            <Pie
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data={dataset_status as any[]}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {dataset_status.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number, name: string) => [v, name]}
            />
            <Legend
              iconSize={6}
              iconType="circle"
              wrapperStyle={{ paddingTop: "8px" }}
              formatter={(value) => (
                <span style={{ fontSize: 11, color: "#6a6a6a" }}>{value}</span>
              )}
            />
          </PieChart>
        </ChartCard>
      </div>

      {/* ─── Top datasets bar chart ──────────────────────────────────── */}
      {topDatasets.length > 0 && (
        <ChartCard
          title="Top 10 Datasets por Volume de Registros"
          description="Datasets com maior número de registros"
          chartKey="topDatasets"
          chartStates={chartStates}
          onToggleFullscreen={toggleFullscreen}
          height={240}
        >
          <BarChart data={topDatasets} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#ebebeb"
            />
            <XAxis
              type="number"
              tickFormatter={(v) => formatNumber(v)}
              tick={{ fontSize: 11, fill: "#929292" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#929292" }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [v.toLocaleString("pt-BR"), "Registros"]}
              cursor={{ fill: "rgba(34,34,34,0.03)" }}
            />
            <Bar
              dataKey="records"
              fill="#ff385c"
              radius={[0, 3, 3, 0]}
              maxBarSize={16}
            />
          </BarChart>
        </ChartCard>
      )}

      {/* ─── Recent datasets table ───────────────────────────────────── */}
      {recentDatasets.length > 0 && (
        <div className="rounded-[14px] overflow-hidden bg-white dark:bg-[#191a1b] border border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]">
          {/* Table section header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#dddddd] dark:border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2.5">
              <span className="text-[#222222] dark:text-[#f7f8f8] text-sm font-semibold">
                Datasets Recentes
              </span>
              {/* Count badge */}
              <span
                className="inline-flex items-center justify-center"
                style={{
                  background: "#f7f7f7",
                  border: "1px solid #dddddd",
                  borderRadius: "4px",
                  color: "#6a6a6a",
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "1px 6px",
                  lineHeight: "1.6",
                }}
              >
                {recentDatasets.length}
              </span>
            </div>
            <Link href="/datasets">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#ff385c] hover:text-[#e00b41] hover:bg-[rgba(255,56,92,0.06)] text-xs font-medium"
                style={{ padding: "4px 8px", height: "auto", borderRadius: "6px" }}
              >
                Ver todos
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  {["Nome", "Status", "Registros", "Colunas", "Atualizado", "Ações"].map((h, i) => (
                    <TableHead
                      key={h}
                      className={`border-0 ${i === 2 || i === 3 || i === 5 ? "text-right" : ""}`}
                      style={{ padding: "10px 16px" }}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDatasets.map((ds) => (
                  <TableRow
                    key={ds.id}
                    className="border-0 transition-colors duration-100 cursor-default"
                    style={{ borderTop: "1px solid #dddddd" }}
                  >
                    {/* Dataset name */}
                    <TableCell className="border-0" style={{ padding: "12px 16px" }}>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex items-center justify-center rounded flex-shrink-0"
                          style={{ width: "24px", height: "24px", background: "rgba(255,56,92,0.08)" }}
                        >
                          <Database style={{ width: "12px", height: "12px", color: "#ff385c" }} />
                        </div>
                        <span
                          className="truncate max-w-[180px] text-[#222222] dark:text-[#f7f8f8]"
                          style={{ fontSize: "13px", fontWeight: 500 }}
                        >
                          {ds.table_name}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status badge */}
                    <TableCell className="border-0" style={{ padding: "12px 16px" }}>
                      <StatusBadge status={ds.status}>
                        {ds.status_display || ds.status}
                      </StatusBadge>
                    </TableCell>

                    {/* Record count */}
                    <TableCell className="border-0 text-right" style={{ padding: "12px 16px" }}>
                      <span className="flex items-center justify-end gap-1 text-[#3f3f3f] dark:text-[#d0d6e0] text-sm">
                        <Hash style={{ width: "12px", height: "12px", color: "#929292" }} />
                        {ds.record_count.toLocaleString("pt-BR")}
                      </span>
                    </TableCell>

                    {/* Column count */}
                    <TableCell className="border-0 text-right" style={{ padding: "12px 16px" }}>
                      <span className="flex items-center justify-end gap-1 text-[#3f3f3f] dark:text-[#d0d6e0] text-sm">
                        <Columns3 style={{ width: "12px", height: "12px", color: "#929292" }} />
                        {Object.keys(ds.column_structure || {}).length}
                      </span>
                    </TableCell>

                    {/* Updated at */}
                    <TableCell className="border-0" style={{ padding: "12px 16px" }}>
                      <span className="flex items-center gap-1 text-[#929292] dark:text-[#62666d] text-xs">
                        <Calendar style={{ width: "12px", height: "12px" }} />
                        {new Date(ds.updated_at).toLocaleDateString("pt-BR")}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="border-0 text-right" style={{ padding: "12px 16px" }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="transition-colors duration-150 text-[#929292] hover:text-[#222222] hover:bg-[#f7f7f7] dark:text-[#62666d] dark:hover:text-[#d0d6e0] dark:hover:bg-[rgba(255,255,255,0.06)]"
                        style={{ width: "28px", height: "28px", borderRadius: "6px" }}
                        title="Abrir dataset"
                        onClick={() => window.open(`/datasets/${ds.id}`, "_blank")}
                      >
                        <Eye style={{ width: "14px", height: "14px" }} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
