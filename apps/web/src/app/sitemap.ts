import type { MetadataRoute } from "next";
import { webEnv } from "@/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = webEnv.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3501";
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
