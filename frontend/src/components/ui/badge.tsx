import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-[10px] py-[4px] text-xs font-normal leading-[1.33] tracking-[-0.224px] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#1d1d1f] text-[#ffffff]",
        secondary: "bg-[#f5f5f7] text-[#1d1d1f] border border-[#e0e0e0]",
        outline: "border border-[#e0e0e0] text-[#1d1d1f] bg-transparent",
        success: "bg-[#1ea64a] text-[#ffffff]",
        warning: "bg-[#f5f5f7] text-[#1d1d1f] border border-[#e0e0e0]",
        attention: "bg-[#f5f5f7] text-[#1d1d1f] border border-[#0066cc]",
        destructive: "bg-[#cc0000] text-[#ffffff]",
        blue: "bg-[#0066cc] text-[#ffffff]",
        promo: "bg-[#0066cc] text-[#ffffff]",
        lime: "bg-[#f5f5f7] text-[#1d1d1f]",
        lilac: "bg-[#f5f5f7] text-[#1d1d1f]",
        navy: "bg-[#272729] text-[#ffffff]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
