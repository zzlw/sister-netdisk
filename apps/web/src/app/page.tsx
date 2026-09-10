import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchHome } from "@/components/search-home";

export const metadata: Metadata = {
  title: "网盘妹-搜网盘资源",
  description: "聚合公开分享，点结果跳原盘。本站不存文件。",
};

export default function HomePage() {
  return (
    <Suspense>
      <SearchHome />
    </Suspense>
  );
}
