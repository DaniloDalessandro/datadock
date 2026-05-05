"use client"
import * as React from "react"
import { Database, LayoutDashboard, HelpCircle, Bot, Globe } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/layout/navigation"

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Datasets", url: "/datasets", icon: Database },
  { title: "Alice", url: "/alice", icon: Bot },
  { title: "Site", url: "/home", icon: Globe, openInNewTab: true },
  { title: "Ajuda", url: "/ajuda", icon: HelpCircle },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [user, setUser] = React.useState({
    name: "Usuário",
    email: "user@dataport.com",
    avatar: "",
  })

  React.useEffect(() => {
    const userData = localStorage.getItem("user_data")
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setUser({
          name: `${parsed.first_name || ""} ${parsed.last_name || ""}`.trim() || "Usuário",
          email: parsed.email || "user@dataport.com",
          avatar: "",
        })
      } catch {
        // ignore parse errors
      }
    }
  }, [])

  return (
    <Sidebar className="bg-[#ffffff] border-r border-[#e0e0e0]" {...props}>
      <SidebarHeader className="bg-[#ffffff] px-4 py-5 border-b border-[#e0e0e0]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#000000] rounded-[8px] flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4 text-[#ffffff]" />
          </div>
          <div>
            <p className="text-[#1d1d1f] font-semibold text-base leading-none tracking-[-0.374px]">DataDock</p>
            <p className="text-[#7a7a7a] text-xs mt-1 tracking-[-0.224px]">Gestão de Dados</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#ffffff] px-2 py-4">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
            const baseClass = cn(
              "flex items-center gap-3 px-3 py-2 text-[14px] tracking-[-0.224px] rounded-[8px] transition-colors duration-150",
              isActive
                ? "bg-[#f5f5f7] text-[#0066cc] font-semibold"
                : "text-[#1d1d1f] font-normal hover:bg-[#f5f5f7]"
            )

            return item.openInNewTab ? (
              <a
                key={item.title}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={baseClass}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.title}</span>
              </a>
            ) : (
              <Link
                key={item.title}
                href={item.url}
                className={baseClass}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter className="bg-[#ffffff] border-t border-[#e0e0e0] p-2">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
