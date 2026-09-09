"use client";

import { BodyScrollbars } from "@repo/ui/components/overlay-scrollbars";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
    >
      <BodyScrollbars />
      {children}
    </ThemeProvider>
  );
}
