import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "search" | "error"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[44px] w-full bg-[#ffffff] px-[14px] py-[12px] text-[17px] font-normal text-[#1d1d1f] tracking-[-0.374px] border border-[#e0e0e0] rounded-[8px] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#7a7a7a] focus:outline-none focus:border-[#0066cc] focus:border-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f5f5f7] leading-[1.47]",
          variant === "search" && "rounded-full bg-[#ffffff] border border-[rgba(0,0,0,0.08)] focus:border-[#0066cc] pl-10",
          variant === "error" && "border-[#cc0000] focus:border-[#cc0000]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
