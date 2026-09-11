import path from "node:path";
import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // Docker / Compose 要 standalone；Vercel 官方构建不能带这个。
  ...(!isVercel ? { output: "standalone" as const } : {}),
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  reactCompiler: true,
  transpilePackages: ["@repo/shared", "@repo/ui"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
