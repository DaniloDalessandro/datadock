"use client"

import { ChevronRight, ExternalLink, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  onFormAction,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    external?: boolean
    openInNewTab?: boolean
    items?: {
      title: string
      url: string
      action?: string
    }[]
  }[]
  onFormAction?: (formType: string) => void
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup style={{ padding: 0 }}>
      {/* Section label */}
      <SidebarGroupLabel
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: "#929292",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "8px 8px 4px",
          lineHeight: 1,
        }}
        className="dark:[color:#62666d]"
      >
        Plataforma
      </SidebarGroupLabel>

      <SidebarMenu style={{ gap: 1 }}>
        {items.map((item) => {
          const isActive =
            pathname === item.url || pathname.startsWith(item.url + "/")

          /* ── Collapsible item (has sub-items) ── */
          if (item.items) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        height: 34,
                        padding: "0 8px",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        transition: "background 150ms, color 150ms",
                        background: isActive ? "rgba(255,56,92,0.08)" : "transparent",
                        color: isActive ? "#ff385c" : "#6a6a6a",
                        borderLeft: isActive ? "2px solid #ff385c" : "2px solid transparent",
                        paddingLeft: isActive ? 6 : 8,
                      }}
                      className={!isActive ? "hover:!bg-[#f7f7f7] hover:!text-[#222222] dark:hover:!bg-[rgba(255,255,255,0.05)] dark:hover:!text-[#d0d6e0]" : "dark:!bg-[rgba(255,56,92,0.12)] dark:!text-[#ff7093]"}
                    >
                      {item.icon && (
                        <item.icon
                          style={{
                            width: 16,
                            height: 16,
                            flexShrink: 0,
                            opacity: isActive ? 1 : 0.7,
                            transition: "opacity 150ms",
                          }}
                        />
                      )}
                      <span style={{ flex: 1 }}>{item.title}</span>
                      <ChevronRight
                        style={{
                          width: 14,
                          height: 14,
                          color: "#929292",
                          transition: "transform 150ms",
                        }}
                        className="group-data-[state=open]/collapsible:rotate-90"
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub style={{ paddingLeft: 28, marginTop: 1 }}>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            style={{
                              height: 30,
                              fontSize: 13,
                              fontWeight: 500,
                              color: "#6a6a6a",
                              borderRadius: 6,
                              padding: "0 8px",
                            }}
                            className="hover:!bg-[#f7f7f7] hover:!text-[#222222] dark:hover:!bg-[rgba(255,255,255,0.05)] dark:!text-[#8a8f98] dark:hover:!text-[#d0d6e0]"
                          >
                            {subItem.action ? (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (subItem.action) {
                                    onFormAction?.(subItem.action)
                                  }
                                }}
                                className="w-full text-left"
                              >
                                <span>{subItem.title}</span>
                              </a>
                            ) : (
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          /* ── Flat item (no sub-items) ── */
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 34,
                  padding: "0 8px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  transition: "background 150ms, color 150ms",
                  background: isActive ? "rgba(255,56,92,0.08)" : "transparent",
                  color: isActive ? "#ff385c" : "#6a6a6a",
                  borderLeft: isActive ? "2px solid #ff385c" : "2px solid transparent",
                  paddingLeft: isActive ? 6 : 8,
                  outline: "none",
                  border: isActive ? "none" : "none",
                  borderLeftWidth: "2px",
                  borderLeftStyle: "solid",
                  borderLeftColor: isActive ? "#ff385c" : "transparent",
                }}
                className={!isActive ? "hover:!bg-[#f7f7f7] hover:!text-[#222222] dark:hover:!bg-[rgba(255,255,255,0.05)] dark:!text-[#8a8f98] dark:hover:!text-[#d0d6e0]" : "dark:!bg-[rgba(255,56,92,0.12)] dark:!text-[#ff7093] dark:![border-left-color:#ff385c]"}
              >
                {item.external || item.openInNewTab ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                    }}
                  >
                    {item.icon && (
                      <item.icon
                        style={{
                          width: 16,
                          height: 16,
                          flexShrink: 0,
                          opacity: isActive ? 1 : 0.7,
                          transition: "opacity 150ms",
                        }}
                      />
                    )}
                    <span className="flex items-center gap-1.5">
                      {item.title}
                      {item.openInNewTab && <ExternalLink className="h-3 w-3 opacity-70" />}
                    </span>
                  </a>
                ) : (
                  <Link
                    href={item.url}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                    }}
                  >
                    {item.icon && (
                      <item.icon
                        style={{
                          width: 16,
                          height: 16,
                          flexShrink: 0,
                          opacity: isActive ? 1 : 0.7,
                          transition: "opacity 150ms",
                        }}
                      />
                    )}
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
