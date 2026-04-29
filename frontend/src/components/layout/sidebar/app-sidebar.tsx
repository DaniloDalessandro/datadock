import * as React from "react"
import {
  Database,
  LayoutDashboard,
  HelpCircle,
  Bot,
  Globe
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavMain, NavUser } from "@/components/layout/navigation"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Datasets",
      url: "/datasets",
      icon: Database,
    },
    {
      title: "Alice",
      url: "/alice",
      icon: Bot,
    },
    {
      title: "Site",
      url: "/home",
      icon: Globe,
      openInNewTab: true,
    },
    {
      title: "Ajuda",
      url: "/ajuda",
      icon: HelpCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: "Usuário",
    email: "user@datadock.com",
    avatar: "",
  })

  React.useEffect(() => {
    const userData = localStorage.getItem("user_data")
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setUser({
          name: `${parsed.first_name || ""} ${parsed.last_name || ""}`.trim() || "Usuário",
          email: parsed.email || "user@datadock.com",
          avatar: "",
        })
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  return (
    <Sidebar
      {...props}
      className="bg-white dark:bg-[#0f1011] border-r border-[#dddddd] dark:border-[rgba(255,255,255,0.06)]"
      style={
        {
          "--sidebar-width": "240px",
          "--sidebar-width-icon": "52px",
        } as React.CSSProperties
      }
    >
      {/* Sidebar header — logo mark + wordmark */}
      <SidebarHeader
        className="p-4 border-b border-[#dddddd] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#0f1011]"
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none select-none"
              style={{ background: "transparent", padding: 0, height: "auto" }}
            >
              {/* Logo icon — Rausch tinted bg, red icon */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(255,56,92,0.10)",
                  border: "1px solid rgba(255,56,92,0.18)",
                  flexShrink: 0,
                }}
              >
                <Database style={{ width: 16, height: 16, color: "#ff385c" }} />
              </div>

              {/* Wordmark */}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#222222",
                  letterSpacing: "-0.24px",
                  lineHeight: 1,
                }}
                className="dark:text-[#f7f8f8]"
              >
                DataDock
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation area */}
      <SidebarContent
        style={{ padding: "12px 8px" }}
        className="bg-white dark:bg-[#0f1011]"
      >
        <NavMain items={data.navMain} />
      </SidebarContent>

      {/* Footer — user menu */}
      <SidebarFooter
        className="p-2 border-t border-[#dddddd] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#0f1011]"
      >
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
