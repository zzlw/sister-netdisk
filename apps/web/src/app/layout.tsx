import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppProviders } from "@/components/app-providers";
import { SkipToMain } from "@/components/skip-to-main";
import { webEnv } from "@/env";
import "./globals.css";

const siteUrl = webEnv.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3501";
const siteDescription = "聚合公开分享，点结果跳原盘。本站不存储文件。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "网盘妹",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "网盘妹",
  },
  title: {
    default: "网盘妹",
    template: "%s · 网盘妹",
  },
  description: siteDescription,
  openGraph: {
    title: "网盘妹",
    description: siteDescription,
    locale: "zh_CN",
    type: "website",
    url: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  viewportFit: "cover",
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
        <SkipToMain />
        <NuqsAdapter>
          <AppProviders>{children}</AppProviders>
        </NuqsAdapter>
      </body>
    </html>
  );
}
