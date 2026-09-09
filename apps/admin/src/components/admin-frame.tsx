"use client";

import { ScrollArea } from "@repo/ui/components/scroll-area";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/sidebar";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return children;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <ScrollArea className="flex-1">
          <main id="main" className="flex flex-col gap-6 p-4 lg:p-6">
            {children}
          </main>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
