import path from "node:path";
import type { NextConfig } from "next";

const apiOrigin = process.env.API_INTERNAL_URL ?? "http://localhost:3500";
const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // Docker / Compose 要 standalone；Vercel 官方构建不能带这个。
  ...(!isVercel ? { output: "standalone" as const } : {}),
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  reactCompiler: true,
  transpilePackages: ["@repo/shared", "@repo/ui"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3590",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
