"use client"

import { AppSidebar } from "@/components/layout/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import React, { memo, useMemo } from "react"
import { AuthGuard } from "@/components/auth"

const capitalize = (s: string) => {
  if (typeof s !== "string" || s.length === 0) {
    return ""
  }
  const decodedString = decodeURIComponent(s)
  return (
    decodedString.charAt(0).toUpperCase() +
    decodedString.slice(1).replace(/-/g, " ")
  )
}

const MemoizedBreadcrumb = memo(({ pathSegments }: { pathSegments: string[] }) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            href="/dashboard"
            className="text-sm transition-colors duration-150 text-[#929292] hover:text-[#222222] dark:text-[#62666d] dark:hover:text-[#d0d6e0]"
          >
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join("/")}`
          const isLast = index === pathSegments.length - 1

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator className="text-[#c1c1c1] dark:text-[#62666d]" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-sm font-semibold text-[#222222] dark:text-[#d0d6e0]">
                    {capitalize(segment)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={href}
                    className="text-sm transition-colors duration-150 text-[#929292] hover:text-[#222222] dark:text-[#62666d] dark:hover:text-[#d0d6e0]"
                  >
                    {capitalize(segment)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
})

MemoizedBreadcrumb.displayName = "MemoizedBreadcrumb"

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  const pathSegments = useMemo(() =>
    pathname.split("/").filter((segment) => segment),
    [pathname]
  )

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          {/* Header — white bg, hairline border-bottom, 80px height */}
          <header
            className="sticky top-0 z-20 flex shrink-0 items-center gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white dark:bg-[#0f1011] border-b border-[#dddddd] dark:border-[rgba(255,255,255,0.06)]"
            style={{ height: "80px" }}
          >
            <SidebarTrigger
              className="-ml-1 transition-colors duration-150 text-[#6a6a6a] hover:text-[#222222] dark:text-[#62666d] dark:hover:text-[#d0d6e0]"
            />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4 bg-[#dddddd] dark:bg-[rgba(255,255,255,0.08)]"
            />
            <MemoizedBreadcrumb pathSegments={pathSegments} />
          </header>
          {/* Main content */}
          <main
            className="flex-1 p-4 bg-[#f7f7f7] dark:bg-[#08090a]"
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
