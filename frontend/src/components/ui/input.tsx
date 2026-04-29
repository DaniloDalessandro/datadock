import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base — Airbnb text-input spec: h-14, hairline border, 8px radius
        "w-full min-w-0 h-14",
        "rounded-[8px]",
        "border border-[#dddddd] bg-white",
        "px-[12px] py-[14px]",
        "text-[16px] leading-normal font-[400]",
        "text-[#222222] placeholder:text-[#6a6a6a]",
        "transition-[border-color] duration-150",
        "outline-none",
        // Focus — 2px ink border, no glow/ring
        "focus-visible:border-[2px] focus-visible:border-[#222222]",
        // Error state
        "aria-invalid:border-[#c13515]",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f7f7f7]",
        // File input styling
        "file:text-[#222222] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Selection
        "selection:bg-[#ff385c] selection:text-white",
        // Dark mode
        "dark:bg-[rgba(255,255,255,0.04)] dark:border-[rgba(255,255,255,0.10)] dark:text-[#f7f8f8]",
        "dark:placeholder:text-[#62666d]",
        "dark:focus-visible:border-[rgba(255,255,255,0.40)]",
        "dark:aria-invalid:border-[#ef4444]",
        "dark:disabled:bg-[rgba(255,255,255,0.02)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
