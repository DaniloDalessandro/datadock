import * as React from "react"
import { cn } from "@/lib/utils"

type StatusTone =
  | "active"
  | "inactive"
  | "archived"
  | "processing"
  | "pending"
  | "error"

// Light-first Airbnb badge styles with dark variants
const STATUS_CLASS: Record<StatusTone, string> = {
  active:
    "text-[#27a644] bg-[rgba(39,166,68,0.08)] border-[rgba(39,166,68,0.20)] dark:text-[#10b981] dark:bg-[rgba(16,185,129,0.1)] dark:border-[rgba(16,185,129,0.2)]",
  inactive:
    "text-[#6a6a6a] bg-[#f7f7f7] border-[#dddddd] dark:text-[#8a8f98] dark:bg-[rgba(255,255,255,0.04)] dark:border-[rgba(255,255,255,0.08)]",
  archived:
    "text-[#6a6a6a] bg-[#f7f7f7] border-[#dddddd] dark:text-[#8a8f98] dark:bg-[rgba(255,255,255,0.04)] dark:border-[rgba(255,255,255,0.08)]",
  processing:
    "text-[#ff385c] bg-[rgba(255,56,92,0.08)] border-[rgba(255,56,92,0.20)] dark:text-[#ff7093] dark:bg-[rgba(255,56,92,0.12)] dark:border-[rgba(255,56,92,0.25)]",
  pending:
    "text-[#d97706] bg-[rgba(217,119,6,0.08)] border-[rgba(217,119,6,0.20)] dark:text-[#f59e0b] dark:bg-[rgba(245,158,11,0.1)] dark:border-[rgba(245,158,11,0.2)]",
  error:
    "text-[#c13515] bg-[rgba(193,53,21,0.06)] border-[rgba(193,53,21,0.20)] dark:text-[#ef4444] dark:bg-[rgba(239,68,68,0.1)] dark:border-[rgba(239,68,68,0.2)]",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  archived: "Arquivado",
  processing: "Processando",
  pending: "Pendente",
  error: "Erro",
}

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: string
  children?: React.ReactNode
  className?: string
}) {
  const tone = (status as StatusTone) in STATUS_CLASS ? (status as StatusTone) : "inactive"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-[1px] text-[11px] font-medium whitespace-nowrap",
        STATUS_CLASS[tone],
        className
      )}
    >
      {children || STATUS_LABELS[status] || status}
    </span>
  )
}
