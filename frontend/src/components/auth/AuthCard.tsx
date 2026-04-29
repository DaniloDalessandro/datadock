import * as React from "react"
import { cn } from "@/lib/utils"

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-[14px] border border-[#dddddd] bg-white p-8",
        "shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px,rgba(0,0,0,0.1)_0_4px_8px]",
        "dark:bg-[#191a1b] dark:border-[rgba(255,255,255,0.08)]",
        "dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {children}
    </div>
  )
}

