"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/components/sidebar";
import { authClient } from "@repo/ui/lib/auth-client";
import { EllipsisVerticalIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

// user 只作占位：真身份一律读会话，登出走 Better Auth。
export function NavUser({
  user,
}: {
  user?: { name: string; email: string; avatar?: string };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const name = session?.user.name ?? user?.name ?? "未登录";
  const email = session?.user.email ?? user?.email ?? "";
  const avatar = session?.user.image ?? user?.avatar ?? undefined;

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const identity = (
    nameText: string,
    emailText: string,
    avatarSrc?: string,
  ) => (
    <>
      <Avatar className="size-8 rounded-lg grayscale">
        <AvatarImage src={avatarSrc} alt={nameText} />
        <AvatarFallback className="rounded-lg">
          {initials(nameText)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{nameText}</span>
        <span className="truncate text-xs text-muted-foreground">
          {emailText}
        </span>
      </div>
    </>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isPending}
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            {identity(name, email, avatar)}
            <EllipsisVerticalIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  {identity(name, email, avatar)}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut()}>
              <LogOutIcon />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
