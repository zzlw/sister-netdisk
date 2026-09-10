import type { MetadataRoute } from "next";

const name = "网盘妹";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name,
    short_name: name,
    description: "聚合公开分享，点结果跳原盘。本站不存储文件。",
    lang: "zh-CN",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#18181b",
    icons: [
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
