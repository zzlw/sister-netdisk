import { Separator } from "@repo/ui/components/separator";
import { SidebarTrigger } from "@repo/ui/components/sidebar";
import { ThemeModeToggle } from "@repo/ui/components/theme-mode-toggle";

export function SiteHeader() {
  return (
    <header className="flex h-[var(--header-height,3rem)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height,3rem)]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center data-vertical:h-4 data-vertical:self-center"
        />
        <p className="text-base font-medium">后台</p>
        <div className="ml-auto flex items-center gap-2">
          <ThemeModeToggle />
        </div>
      </div>
    </header>
  );
}
