import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base — layout, typography, transitions, focus ring, disabled
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[8px]",
    "text-[16px] leading-none",
    "font-[500]",
    "transition-all duration-150 ease-out",
    "disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    // Focus ring — Airbnb uses ink border, no glow
    "outline-none",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#222222]",
    "dark:focus-visible:outline-[#ff385c]",
    // Invalid state
    "aria-invalid:outline-[#c13515]/60",
  ],
  {
    variants: {
      variant: {
        // Primary — Rausch red CTA
        default: [
          "bg-[#ff385c] text-white",
          "hover:bg-[#e00b41]",
          "active:bg-[#c00030]",
          "disabled:bg-[#ffd1da] disabled:text-[#ff385c]/60",
        ],

        // Secondary — white bg, ink border
        secondary: [
          "bg-white text-[#222222]",
          "border border-[#222222]",
          "hover:bg-[#f7f7f7]",
          "active:bg-[#f2f2f2]",
          "dark:bg-[rgba(255,255,255,0.06)] dark:text-[#d0d6e0] dark:border-[rgba(255,255,255,0.15)]",
          "dark:hover:bg-[rgba(255,255,255,0.10)] dark:hover:text-[#f7f8f8]",
        ],

        // Ghost / tertiary — transparent, ink text, underline on hover
        ghost: [
          "bg-transparent text-[#222222]",
          "hover:bg-[#f7f7f7]",
          "active:bg-[#f2f2f2]",
          "dark:text-[#8a8f98] dark:hover:bg-[rgba(255,255,255,0.05)] dark:hover:text-[#f7f8f8]",
        ],

        // Outline — white bg, hairline border, ink text
        outline: [
          "bg-white text-[#222222]",
          "border border-[#dddddd]",
          "hover:border-[#c1c1c1] hover:bg-[#f7f7f7]",
          "active:bg-[#f2f2f2]",
          "dark:bg-[rgba(255,255,255,0.035)] dark:text-[#d0d6e0] dark:border-[rgba(255,255,255,0.08)]",
          "dark:hover:bg-[rgba(255,255,255,0.06)] dark:hover:border-[rgba(255,255,255,0.15)] dark:hover:text-[#f7f8f8]",
        ],

        // Glass — for floating surfaces on colored backgrounds
        glass: [
          "bg-white/85 text-[#222222]",
          "border border-[#dddddd] backdrop-blur-sm",
          "hover:bg-white hover:border-[#c1c1c1]",
          "dark:bg-[rgba(255,255,255,0.06)] dark:text-[#d0d6e0] dark:border-[rgba(255,255,255,0.08)]",
          "dark:hover:bg-[rgba(255,255,255,0.10)] dark:hover:border-[rgba(255,255,255,0.14)] dark:hover:text-[#f7f8f8]",
        ],

        // Pill — Rausch, full radius
        pill: [
          "bg-[#ff385c] text-white rounded-full",
          "text-[14px] font-[500]",
          "hover:bg-[#e00b41]",
          "active:bg-[#c00030]",
          "disabled:bg-[#ffd1da]",
        ],

        // Destructive — red for danger actions
        destructive: [
          "bg-[rgba(193,53,21,0.08)] text-[#c13515]",
          "border border-[rgba(193,53,21,0.25)]",
          "hover:bg-[rgba(193,53,21,0.14)] hover:border-[rgba(193,53,21,0.40)]",
          "active:bg-[rgba(193,53,21,0.20)]",
          "focus-visible:outline-[#c13515]",
          "dark:bg-[rgba(239,68,68,0.12)] dark:text-[#ef4444] dark:border-[rgba(239,68,68,0.25)]",
          "dark:hover:bg-[rgba(239,68,68,0.20)]",
        ],

        // Text link
        link: [
          "bg-transparent text-[#ff385c]",
          "hover:text-[#e00b41] hover:underline underline-offset-4",
          "rounded-none",
        ],
      },

      size: {
        sm:        "h-9 px-[14px] py-[8px] text-[14px]",
        default:   "h-12 px-[24px] py-[14px] text-[16px]",
        lg:        "h-14 px-[32px] py-[16px] text-[16px]",
        icon:      "size-10 p-0",
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
