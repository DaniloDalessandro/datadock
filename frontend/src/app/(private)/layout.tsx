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
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join("/")}`
          const isLast = index === pathSegments.length - 1

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{capitalize(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>
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
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <MemoizedBreadcrumb pathSegments={pathSegments} />
          </header>
          <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}