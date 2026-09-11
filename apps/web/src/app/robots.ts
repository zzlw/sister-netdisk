import type { MetadataRoute } from "next";
import { webEnv } from "@/env";

export default function robots(): MetadataRoute.Robots {
  const base = webEnv.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3501";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
