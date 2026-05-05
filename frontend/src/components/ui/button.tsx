import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 cursor-pointer active:scale-95",
  {
    variants: {
      variant: {
        /* Primary — Action Blue pill */
        default:
          "bg-[#0066cc] text-[#ffffff] rounded-full font-normal text-[17px] tracking-[-0.374px] px-[22px] py-[11px] hover:bg-[#0071e3]",
        /* Secondary — ghost pill with blue border */
        secondary:
          "bg-transparent text-[#0066cc] border border-[#0066cc] rounded-full font-normal text-[17px] tracking-[-0.374px] px-[22px] py-[11px] hover:bg-[#f5f5f7]",
        /* Ghost — text only, blue */
        ghost:
          "bg-transparent text-[#0066cc] rounded-full font-normal text-[17px] tracking-[-0.374px] px-[12px] py-[8px] hover:bg-[#f5f5f7]",
        /* Ghost on dark surfaces */
        "ghost-dark":
          "bg-transparent text-[#2997ff] rounded-full font-normal text-[17px] tracking-[-0.374px] px-[12px] py-[8px] hover:bg-[rgba(255,255,255,0.08)]",
        /* Dark utility rect — nav/utility actions */
        "dark-utility":
          "bg-[#1d1d1f] text-[#ffffff] rounded-[8px] font-normal text-[14px] tracking-[-0.224px] px-[15px] py-[8px] hover:bg-[#333333]",
        /* Pearl capsule — product card secondary */
        "pearl-capsule":
          "bg-[#fafafc] text-[#333333] border-[3px] border-[#f0f0f0] rounded-[11px] font-normal text-[14px] tracking-[-0.224px] px-[14px] py-[8px] hover:bg-[#f5f5f7]",
        /* Store hero — large blue pill */
        "store-hero":
          "bg-[#0066cc] text-[#ffffff] rounded-full font-light text-[18px] px-[28px] py-[14px] hover:bg-[#0071e3]",
        /* Destructive */
        destructive:
          "bg-[#cc0000] text-[#ffffff] rounded-full font-normal text-[17px] tracking-[-0.374px] px-[22px] py-[11px] hover:bg-[#aa0000]",
        /* Outline */
        outline:
          "bg-[#ffffff] text-[#1d1d1f] border border-[#e0e0e0] rounded-[18px] font-normal text-[17px] tracking-[-0.374px] px-[22px] py-[11px] hover:bg-[#f5f5f7]",
        /* Link */
        link:
          "text-[#0066cc] underline-offset-4 hover:underline p-0 rounded-none font-normal",
        /* backward compat */
        "buy-cta":
          "bg-[#0066cc] text-[#ffffff] rounded-full font-normal text-[17px] tracking-[-0.374px] px-[22px] py-[11px] hover:bg-[#0071e3]",
      },
      size: {
        default: "min-h-[44px] text-[17px]",
        sm: "min-h-[34px] px-[15px] py-[8px] text-[14px] rounded-[8px]",
        lg: "min-h-[52px] px-[28px] py-[14px] text-[18px]",
        icon: "h-[44px] w-[44px] p-0 rounded-full bg-[rgba(210,210,215,0.64)] text-[#1d1d1f] hover:bg-[rgba(210,210,215,0.8)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
