"use client";

import type { LucideIcon } from "lucide-react";
import { FolderIcon, HardDriveIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/sidebar";

const data = {
  navMain: [
    { title: "资源", url: "/resources", icon: FolderIcon },
    { title: "用户", url: "/users", icon: UsersIcon },
  ],
  navSecondary: [] as {
    title: string;
    url: string;
    icon: LucideIcon;
  }[],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/resources" />}
            >
              <HardDriveIcon className="size-5!" />
              <span className="text-base font-semibold">网盘妹</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
