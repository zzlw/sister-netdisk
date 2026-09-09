"use client";

import { BodyScrollbars } from "@repo/ui/components/overlay-scrollbars";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useState } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        <BodyScrollbars />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
