import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AdminFrame } from "@/components/admin-frame";
import { AppProviders } from "@/components/app-providers";
import { adminEnv } from "@/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    adminEnv.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3502",
  ),
  title: "网盘妹 · 后台",
  description: "录入和整理网盘分享资源",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      lang="zh-CN"
      data-overlayscrollbars-initialize
      className="h-full antialiased"
    >
      <body
        data-overlayscrollbars-initialize
        className="flex min-h-full flex-col"
      >
        <NuqsAdapter>
          <AppProviders>
            <AdminFrame>{children}</AdminFrame>
          </AppProviders>
        </NuqsAdapter>
      </body>
    </html>
  );
}
