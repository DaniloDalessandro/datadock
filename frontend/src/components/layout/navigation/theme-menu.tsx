"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"

type ThemeMode = "light" | "dark" | "system"

function resolveSystemTheme() {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  const resolved = mode === "system" ? resolveSystemTheme() : mode
  root.classList.toggle("dark", resolved === "dark")
}

export function ThemeMenu() {
  const [theme, setTheme] = React.useState<ThemeMode>("system")

  React.useEffect(() => {
    const saved = (localStorage.getItem("datadock-theme") as ThemeMode | null) || "system"
    setTheme(saved)
    applyTheme(saved)
  }, [])

  const handleThemeChange = (value: string) => {
    const next = value as ThemeMode
    setTheme(next)
    localStorage.setItem("datadock-theme", next)
    applyTheme(next)
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger style={{ color: "#d0d6e0" }}>
        <Monitor className="mr-2 h-4 w-4" style={{ color: "#8a8f98" }} />
        Tema
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        style={{
          background: "#191a1b",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          <DropdownMenuRadioItem value="light" style={{ color: "#d0d6e0" }}>
            <Sun className="mr-2 h-4 w-4" style={{ color: "#8a8f98" }} />
            Claro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" style={{ color: "#d0d6e0" }}>
            <Moon className="mr-2 h-4 w-4" style={{ color: "#8a8f98" }} />
            Escuro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" style={{ color: "#d0d6e0" }}>
            <Monitor className="mr-2 h-4 w-4" style={{ color: "#8a8f98" }} />
            Sistema
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

