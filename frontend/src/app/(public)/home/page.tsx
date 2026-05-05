'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Database,
  Search,
  RefreshCw,
  Copy,
  Check,
  Download,
  ChevronRight,
  BarChart3,
  Globe,
  Table2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { config as appConfig } from '@/lib/config'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SiteConfig {
  company_name: string
  hero_title: string
  hero_subtitle: string
  about_text: string
  phone: string
  email: string
  address: string
  whatsapp?: string
}

interface PublicDataset {
  id: number | string
  table_name: string
  status: string
  record_count: number
  column_structure: Record<string, unknown>
  created_at: string
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const DEFAULT_SITE_CONFIG: SiteConfig = {
  company_name: 'DataDock',
  hero_title: 'Dados organizados para operação, consulta e análise',
  hero_subtitle:
    'Centralize datasets, monitore estruturas e disponibilize consultas em uma interface simples.',
  about_text: 'Plataforma para gestão e visualização de datasets com foco operacional.',
  phone: '(00) 00000-0000',
  email: 'contato@datadock.local',
  address: 'Ambiente local',
}

const CATEGORIES = ['Todos', 'Financeiro', 'Logística', 'IA', 'Saúde', 'Público']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryForIndex(index: number): string {
  return CATEGORIES[1 + (index % (CATEGORIES.length - 1))]
}

function isNewDataset(createdAt: string): boolean {
  const created = new Date(createdAt)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return created >= thirtyDaysAgo
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTableName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Download Modal ───────────────────────────────────────────────────────────

function DownloadModal({
  dataset,
  onClose,
}: {
  dataset: PublicDataset
  onClose: () => void
}) {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv')
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      const params = new URLSearchParams()
      params.append('file_format', format)
      const url = `${appConfig.apiUrl}/api/data-import/public-download/${dataset.id}/?${params.toString()}`
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${dataset.table_name}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } finally {
      setDownloading(false)
      onClose()
    }
  }

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-[18px] border border-[#e0e0e0] p-8 w-full max-w-sm mx-4 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        {/* Title */}
        <h2 className="text-[21px] font-semibold text-[#1d1d1f] tracking-[-0.374px] mb-6 leading-[1.24]">
          {formatTableName(dataset.table_name)}
        </h2>

        {/* Format selector */}
        <div className="mb-7">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#7a7a7a] mb-3">
            Formato
          </p>
          <div className="flex gap-2">
            {(['csv', 'xlsx'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={[
                  'flex-1 h-9 rounded-full text-[13px] font-medium transition-all duration-200',
                  format === f
                    ? 'bg-[#0066cc] text-white'
                    : 'bg-[#f5f5f7] text-[#1d1d1f] border border-[#e0e0e0] hover:bg-[#e0e0e0]',
                ].join(' ')}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="default"
            className="w-full gap-2"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Baixando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Baixar
              </>
            )}
          </Button>
          <button
            onClick={onClose}
            className="text-[14px] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="border border-[#e0e0e0] rounded-[18px] p-6 bg-[#ffffff] animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-5 bg-[#e0e0e0] rounded-full w-3/4" />
        <div className="h-5 bg-[#e0e0e0] rounded-full w-12" />
      </div>
      <div className="h-4 bg-[#f5f5f7] rounded-full w-full mb-2" />
      <div className="h-4 bg-[#f5f5f7] rounded-full w-5/6 mb-6" />
      <div className="flex gap-3 mb-5">
        <div className="h-4 bg-[#f5f5f7] rounded-full w-16" />
        <div className="h-4 bg-[#f5f5f7] rounded-full w-20" />
        <div className="h-4 bg-[#f5f5f7] rounded-full w-14" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 bg-[#e0e0e0] rounded-full flex-1" />
        <div className="h-9 w-9 bg-[#e0e0e0] rounded-full" />
      </div>
    </div>
  )
}

function DatasetCard({
  dataset,
  index,
}: {
  dataset: PublicDataset
  index: number
}) {
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const columnCount = Object.keys(dataset.column_structure ?? {}).length
  const isPopular = dataset.record_count > 1000
  const isNew = isNewDataset(dataset.created_at)
  const category = getCategoryForIndex(index)

  function handleCopy() {
    const url =
      typeof window !== 'undefined'
        ? window.location.origin + '/datasets/' + dataset.id
        : '/datasets/' + dataset.id
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      {showModal && (
        <DownloadModal dataset={dataset} onClose={() => setShowModal(false)} />
      )}

      <div className="group border border-[#e0e0e0] rounded-[18px] p-6 bg-[#ffffff] hover:border-[#0066cc]/60 hover:shadow-[0_4px_24px_rgba(0,102,204,0.08)] transition-all duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-[17px] text-[#1d1d1f] leading-[1.24] tracking-[-0.374px] line-clamp-2">
            {formatTableName(dataset.table_name)}
          </h3>
          <span className="shrink-0 inline-flex items-center gap-1 bg-[#e8f5e9] text-[#2e7d32] text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-[#2e7d32] rounded-full" />
            Ativo
          </span>
        </div>

        {/* Description */}
        <p className="text-[14px] text-[#7a7a7a] leading-[1.43] tracking-[-0.224px] mb-4 line-clamp-2">
          Dataset com {dataset.record_count.toLocaleString('pt-BR')} registros e{' '}
          {columnCount} colunas — categoria {category}.
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-[11px] font-medium text-[#7a7a7a] bg-[#f5f5f7] px-2 py-0.5 rounded-full">
            {category}
          </span>
          {isPopular && (
            <span className="text-[11px] font-medium text-[#0066cc] bg-[#e8f0fb] px-2 py-0.5 rounded-full">
              Popular
            </span>
          )}
          {isNew && (
            <span className="text-[11px] font-medium text-[#7c3aed] bg-[#ede9fe] px-2 py-0.5 rounded-full">
              Novo
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-[12px] text-[#7a7a7a] mb-5 flex-wrap">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            {dataset.record_count.toLocaleString('pt-BR')} registros
          </span>
          <span className="flex items-center gap-1">
            <Table2 className="w-3.5 h-3.5" />
            {columnCount} colunas
          </span>
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            {formatDate(dataset.created_at)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowModal(true)}
            className="flex-1 gap-1.5 text-[13px] rounded-full min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
          <button
            onClick={handleCopy}
            title="Copiar link"
            className="h-9 w-9 flex items-center justify-center border border-[#e0e0e0] rounded-full text-[#7a7a7a] hover:border-[#0066cc]/40 hover:text-[#0066cc] transition-all duration-200 shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#2e7d32]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  )
}

function PopularCard({ dataset, rank }: { dataset: PublicDataset; rank: number }) {
  const columnCount = Object.keys(dataset.column_structure ?? {}).length

  return (
    <div className="border border-[#0066cc]/20 bg-[#ffffff] rounded-[18px] p-6 hover:border-[#0066cc]/50 hover:shadow-[0_4px_24px_rgba(0,102,204,0.10)] transition-all duration-200 flex items-start gap-4">
      <div className="shrink-0 w-10 h-10 rounded-full bg-[#0066cc] flex items-center justify-center text-[#ffffff] font-semibold text-[14px]">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[15px] text-[#1d1d1f] tracking-[-0.374px] mb-1 line-clamp-1">
          {formatTableName(dataset.table_name)}
        </p>
        <p className="text-[13px] text-[#7a7a7a]">
          {dataset.record_count.toLocaleString('pt-BR')} registros · {columnCount} colunas
        </p>
      </div>
      <ChevronRight className="shrink-0 w-4 h-4 text-[#0066cc] self-center" />
    </div>
  )
}

// ─── Data Animation ───────────────────────────────────────────────────────────

const HERO_KEYFRAMES = `
  @keyframes heroFloat {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-10px); }
  }
  @keyframes heroBlink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.25; }
  }
  @keyframes heroBarGrow {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heroExpand {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes heroLineDraw {
    from { stroke-dashoffset: 600; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes heroAreaFade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`

const BAR_HEIGHTS = [38, 62, 48, 80, 55, 72, 90, 65]
const DATA_ROWS = [
  { label: 'vendas_2024', value: '24.5K', pct: '92%' },
  { label: 'clientes_br',  value: '8.1K',  pct: '68%' },
  { label: 'logistica_sp', value: '15.3K', pct: '85%' },
  { label: 'financeiro_q4',value: '3.2K',  pct: '45%' },
]

function DataAnimation() {
  return (
    <>
      <style>{HERO_KEYFRAMES}</style>
      <div
        className="relative rounded-[20px] border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 overflow-hidden"
        style={{ animation: 'heroFloat 7s ease-in-out infinite' }}
      >
        {/* corner glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,102,204,0.18) 0%, transparent 70%)' }}
        />

        {/* live header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-[#34d399]"
              style={{ animation: 'heroBlink 2s ease-in-out infinite' }}
            />
            <span className="text-[11px] font-semibold text-[#cccccc] uppercase tracking-[0.18em]">
              Live data
            </span>
          </div>
          <span className="text-[10px] text-[#7a7a7a] font-mono">DataDock v1.0</span>
        </div>

        {/* mini metric pills */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Datasets', val: '12' },
            { label: 'Registros', val: '48K' },
            { label: 'Colunas', val: '~7' },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-[10px] bg-white/5 border border-white/8 p-2 text-center"
            >
              <p className="text-[15px] font-semibold text-white leading-none mb-0.5">{m.val}</p>
              <p className="text-[10px] text-[#7a7a7a] uppercase tracking-[0.1em]">{m.label}</p>
            </div>
          ))}
        </div>

        {/* SVG line chart */}
        <div className="mb-4 rounded-[10px] bg-white/5 border border-white/8 p-3">
          <p className="text-[10px] text-[#7a7a7a] uppercase tracking-[0.12em] mb-2">Volume mensal</p>
          <svg viewBox="0 0 220 60" className="w-full" preserveAspectRatio="none" style={{ height: 56 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0066cc" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0066cc" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* area fill */}
            <path
              d="M0,52 L20,46 L45,35 L65,40 L90,24 L110,28 L135,16 L155,20 L175,10 L200,13 L220,8 L220,60 L0,60 Z"
              fill="url(#areaGrad)"
              style={{ animation: 'heroAreaFade 1.6s ease-out 0.2s both' }}
            />
            {/* line */}
            <path
              d="M0,52 L20,46 L45,35 L65,40 L90,24 L110,28 L135,16 L155,20 L175,10 L200,13 L220,8"
              fill="none"
              stroke="#2997ff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="600"
              style={{ animation: 'heroLineDraw 2s ease-out 0.1s both' }}
            />
            {/* dots */}
            {([[20,46],[90,24],[155,20],[220,8]] as [number,number][]).map(([x,y],i) => (
              <circle
                key={i}
                cx={x} cy={y} r="2.5"
                fill="#2997ff"
                style={{ animation: `heroFadeUp 0.4s ease-out ${0.8 + i * 0.15}s both` }}
              />
            ))}
          </svg>
        </div>

        {/* bar chart */}
        <div className="flex items-end gap-1.5 h-14 mb-4 px-1">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[3px] origin-bottom"
              style={{
                height: `${h}%`,
                background: `linear-gradient(to top, #0066cc, #2997ff)`,
                opacity: 0.55 + (i / BAR_HEIGHTS.length) * 0.45,
                animation: `heroBarGrow 0.9s cubic-bezier(.22,1,.36,1) ${i * 0.07}s both`,
              }}
            />
          ))}
        </div>

        {/* data rows */}
        <div className="space-y-2.5">
          {DATA_ROWS.map((row, i) => (
            <div
              key={i}
              className="flex items-center gap-3"
              style={{ animation: `heroFadeUp 0.5s ease-out ${0.4 + i * 0.12}s both` }}
            >
              <span className="text-[11px] font-mono text-[#7a7a7a] w-[96px] shrink-0 truncate">
                {row.label}
              </span>
              <div className="flex-1 h-[5px] bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full origin-left"
                  style={{
                    width: row.pct,
                    background: 'linear-gradient(to right, #0066cc, #2997ff)',
                    animation: `heroExpand 1.1s cubic-bezier(.22,1,.36,1) ${0.6 + i * 0.12}s both`,
                  }}
                />
              </div>
              <span className="text-[11px] font-mono text-[#cccccc] w-10 text-right shrink-0">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SiteHomePage() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG)
  const [datasets, setDatasets] = useState<PublicDataset[]>([])
  const [datasetCount, setDatasetCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')

  useEffect(() => {
    const loadData = async () => {
      // Site config
      try {
        const res = await fetch(`${appConfig.apiUrl}/api/site/configuration/`)
        if (res.ok) {
          const result = await res.json()
          const data = result?.success ? result.data : result
          setSiteConfig((prev) => ({ ...prev, ...data }))
        }
      } catch {
        // silent fallback
      }

      // Dataset count
      try {
        const res = await fetch(`${appConfig.apiUrl}/api/data-import/processes/?page_size=1`)
        if (res.ok) {
          const result = await res.json()
          const count =
            typeof result?.count === 'number'
              ? result.count
              : Array.isArray(result?.results)
              ? result.results.length
              : 0
          setDatasetCount(count)
        }
      } catch {
        setDatasetCount(null)
      }

      // Public datasets
      try {
        const res = await fetch(`${appConfig.apiUrl}/api/data-import/public-datasets/`)
        if (res.ok) {
          const result = await res.json()
          const list: PublicDataset[] = result?.success
            ? result.results
            : Array.isArray(result)
            ? result
            : result?.results ?? []
          setDatasets(list)
        }
      } catch {
        setDatasets([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredDatasets = useMemo(() => {
    return datasets.filter((ds, index) => {
      const matchesSearch = ds.table_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const category = getCategoryForIndex(index)
      const matchesCategory =
        activeCategory === 'Todos' || category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [datasets, searchTerm, activeCategory])

  const popularDatasets = useMemo(() => {
    return [...datasets]
      .sort((a, b) => b.record_count - a.record_count)
      .slice(0, 4)
  }, [datasets])

  const avgColumns = useMemo(() => {
    if (datasets.length === 0) return 0
    const total = datasets.reduce(
      (acc, ds) => acc + Object.keys(ds.column_structure ?? {}).length,
      0
    )
    return Math.round(total / datasets.length)
  }, [datasets])

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f]">

      {/* ── Global Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 h-[44px] bg-[#000000] border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
          <Link href="/home" className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#ffffff]" />
            <span className="text-[12px] font-semibold text-[#ffffff] tracking-[-0.12px]">
              {siteConfig.company_name}
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6">
            <a
              href="#datasets"
              className="text-[12px] text-white/75 hover:text-white transition-colors tracking-[-0.12px]"
            >
              Datasets
            </a>
          </nav>

          <Link href="/login">
            <Button variant="dark-utility" size="sm">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0a0a] px-4 sm:px-6 py-[80px] overflow-hidden">
        {/* Grid pattern background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 0%, rgba(0,102,204,0.12) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: 'auto, 48px 48px, 48px 48px',
          }}
        />

        <div className="relative max-w-[1440px] mx-auto">
          <div className="grid lg:grid-cols-[1fr_420px] gap-12 xl:gap-16 items-center">

            {/* ── Left column: text ─────────────────────────────────────── */}
            <div>
              {/* Eyebrow badge */}
              <div className="flex justify-center lg:justify-start mb-8">
                <span className="inline-flex items-center gap-2 bg-white/8 border border-white/12 text-[#cccccc] text-[12px] font-medium px-4 py-1.5 rounded-full backdrop-blur-sm">
                  <Globe className="w-3.5 h-3.5 text-[#2997ff]" />
                  Plataforma de dados abertos
                </span>
              </div>

              {/* Title */}
              <h1
                className="text-center lg:text-left font-semibold text-[#ffffff] leading-[1.07] tracking-[-0.28px] mb-6"
                style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
              >
                {siteConfig.hero_title}
              </h1>

              {/* Subtitle */}
              <p className="text-center lg:text-left text-[#cccccc] text-[17px] leading-[1.47] tracking-[-0.374px] max-w-xl mx-auto lg:mx-0 mb-10">
                {siteConfig.hero_subtitle}
              </p>

              {/* CTA */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-14">
                <a href="#datasets">
                  <Button variant="store-hero" className="gap-2">
                    Explorar Datasets
                  </Button>
                </a>
              </div>

              {/* Stat counters */}
              <div className="grid grid-cols-3 gap-px bg-white/10 rounded-[18px] overflow-hidden border border-white/10">
                <div className="bg-[#0a0a0a] px-6 py-5 text-center">
                  <p className="text-[30px] font-semibold text-[#ffffff] leading-none tracking-[-0.28px] mb-1">
                    {datasetCount !== null ? datasetCount : '—'}
                  </p>
                  <p className="text-[11px] text-[#7a7a7a] uppercase tracking-[0.12em]">
                    Datasets
                  </p>
                </div>
                <div className="bg-[#0a0a0a] px-6 py-5 text-center">
                  <p className="text-[30px] font-semibold text-[#ffffff] leading-none tracking-[-0.28px] mb-1">
                    {avgColumns > 0 ? avgColumns : '—'}
                  </p>
                  <p className="text-[11px] text-[#7a7a7a] uppercase tracking-[0.12em]">
                    Colunas méd.
                  </p>
                </div>
                <div className="bg-[#0a0a0a] px-6 py-5 text-center">
                  <p className="text-[30px] font-semibold text-[#ffffff] leading-none tracking-[-0.28px] mb-1">
                    100%
                  </p>
                  <p className="text-[11px] text-[#7a7a7a] uppercase tracking-[0.12em]">
                    Gratuito
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right column: animation (desktop only) ────────────────── */}
            <div className="hidden lg:block">
              <DataAnimation />
            </div>

          </div>
        </div>
      </section>

      {/* ── Datasets em Destaque ───────────────────────────────────────────── */}
      <section id="datasets" className="bg-[#ffffff] px-4 sm:px-6 py-[80px] scroll-mt-[44px]">
        <div className="max-w-[1440px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#7a7a7a] mb-2">
                Catálogo
              </p>
              <h2 className="text-[40px] font-semibold text-[#1d1d1f] leading-[1.10] tracking-[-0.374px]">
                Datasets em Destaque
              </h2>
            </div>
            <Link href="/datasets-publicos">
              <Button variant="secondary" size="sm" className="gap-1.5">
                Ver todos
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a] pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar dataset pelo nome..."
              className="w-full h-[44px] pl-10 pr-4 bg-[#f5f5f7] border border-[#e0e0e0] rounded-full text-[14px] text-[#1d1d1f] placeholder:text-[#7a7a7a] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all duration-200"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={[
                  'text-[13px] font-medium px-4 py-1.5 rounded-full transition-all duration-200',
                  activeCategory === cat
                    ? 'bg-[#0066cc] text-[#ffffff]'
                    : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e0e0e0]',
                ].join(' ')}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredDatasets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-in fade-in duration-500">
              {filteredDatasets.map((ds, index) => (
                <DatasetCard key={ds.id} dataset={ds} index={index} />
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-4">
                <Database className="w-7 h-7 text-[#7a7a7a]" />
              </div>
              <p className="text-[17px] font-semibold text-[#1d1d1f] mb-2">
                Nenhum dataset encontrado
              </p>
              <p className="text-[14px] text-[#7a7a7a] max-w-xs">
                Tente ajustar o termo de busca ou selecionar outra categoria.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setActiveCategory('Todos')
                }}
                className="mt-5 text-[14px] text-[#0066cc] hover:text-[#0071e3] transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Datasets Populares ─────────────────────────────────────────────── */}
      {popularDatasets.length > 0 && (
        <section className="bg-[#f5f5f7] px-4 sm:px-6 py-[80px]">
          <div className="max-w-[1440px] mx-auto">
            <div className="mb-10">
              <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#7a7a7a] mb-2">
                Mais acessados
              </p>
              <h2 className="text-[40px] font-semibold text-[#1d1d1f] leading-[1.10] tracking-[-0.374px]">
                Datasets Populares
              </h2>
            </div>

            {/* Mobile: horizontal scroll  |  Desktop: 2 cols */}
            <div className="flex gap-4 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-2 sm:gap-4 snap-x snap-mandatory sm:snap-none">
              {popularDatasets.map((ds, i) => (
                <div
                  key={ds.id}
                  className="shrink-0 w-[280px] sm:w-auto snap-start sm:snap-align-none"
                >
                  <PopularCard dataset={ds} rank={i + 1} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0a0a0a] px-4 sm:px-6 pt-16 pb-8">
        <div className="max-w-[1440px] mx-auto">
          {/* Top row: logo + nav links */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-10 mb-12">
            {/* Left: logo + description */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-[#ffffff]" />
                <span className="text-[14px] font-semibold text-[#ffffff] tracking-[-0.12px]">
                  {siteConfig.company_name}
                </span>
              </div>
              <p className="text-[13px] text-[#7a7a7a] leading-[1.54]">
                Plataforma de dados abertos para consulta e análise.
              </p>
            </div>

            {/* Right: nav links */}
            <nav className="flex items-start gap-8 sm:gap-10">
              <div className="flex flex-col gap-3">
                <a
                  href="#datasets"
                  className="text-[13px] text-white/60 hover:text-white transition-colors tracking-[-0.12px]"
                >
                  Plataforma
                </a>
                <Link
                  href="/datasets-publicos"
                  className="text-[13px] text-white/60 hover:text-white transition-colors tracking-[-0.12px]"
                >
                  Datasets
                </Link>
                <Link
                  href="/login"
                  className="text-[13px] text-white/60 hover:text-white transition-colors tracking-[-0.12px]"
                >
                  Entrar
                </Link>
              </div>
            </nav>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[12px] text-[#7a7a7a] tracking-[-0.12px]">
              © 2025 {siteConfig.company_name}. Todos os direitos reservados.
            </p>
            <p className="text-[12px] text-[#7a7a7a] tracking-[-0.12px]">
              v1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
