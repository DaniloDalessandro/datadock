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
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Database className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">DataDock</span>
                <span className="text-xs">Sistema de Gestão de Dados</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
