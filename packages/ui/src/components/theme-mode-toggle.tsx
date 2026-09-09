"use client";

import { Button } from "@repo/ui/components/button";
import { startThemeTransition } from "@repo/ui/lib/theme-transition";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect } from "react";

/** B 端顶栏明暗切换。C 端不要放这个，继续跟系统。 */
export function ThemeModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggle = useCallback(
    (origin?: { clientX: number; clientY: number }) => {
      const next = resolvedTheme === "dark" ? "light" : "dark";
      startThemeTransition(() => setTheme(next), origin);
    },
    [resolvedTheme, setTheme],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "d" ||
        !event.shiftKey ||
        !(event.metaKey || event.ctrlKey)
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative size-8"
      onClick={(event) => toggle(event)}
    >
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">切换深色模式</span>
    </Button>
  );
}
