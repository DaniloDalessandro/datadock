"use client"

import { AppSidebar } from "@/components/layout/sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { usePathname } from "next/navigation"
import React, { memo, useMemo } from "react"
import { AuthGuard } from "@/components/auth"
import Link from "next/link"

const capitalize = (s: string) => {
  if (typeof s !== "string" || s.length === 0) return ""
  return decodeURIComponent(s).charAt(0).toUpperCase() + decodeURIComponent(s).slice(1).replace(/-/g, " ")
}

const Breadcrumb = memo(({ pathSegments }: { pathSegments: string[] }) => (
  <nav className="flex items-center gap-1 text-[14px] tracking-[-0.224px]">
    <Link href="/" className="text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors">
      Home
    </Link>
    {pathSegments.map((segment, index) => {
      const href = `/${pathSegments.slice(0, index + 1).join("/")}`
      const isLast = index === pathSegments.length - 1
      return (
        <React.Fragment key={href}>
          <span className="text-[#7a7a7a] mx-1">›</span>
          {isLast ? (
            <span className="text-[#1d1d1f] font-semibold">{capitalize(segment)}</span>
          ) : (
            <Link href={href} className="text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors">
              {capitalize(segment)}
            </Link>
          )}
        </React.Fragment>
      )
    })}
  </nav>
))
Breadcrumb.displayName = "Breadcrumb"

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const pathSegments = useMemo(() => pathname.split("/").filter(Boolean), [pathname])

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-[#ffffff]">
          <header className="flex h-[44px] shrink-0 items-center gap-3 border-b border-[#e0e0e0] bg-[#f5f5f7] px-4">
            <SidebarTrigger className="text-[#1d1d1f] hover:bg-[#e8e8ed] rounded-[6px]" />
            <Separator orientation="vertical" className="h-4 bg-[#e0e0e0]" />
            <Breadcrumb pathSegments={pathSegments} />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
