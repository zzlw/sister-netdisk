import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchHome } from "@/components/search-home";

export const metadata: Metadata = {
  title: "搜网盘资源",
  description: "在已收录的分享里搜索，点结果跳到对应网盘。本站不存文件。",
};

export default function HomePage() {
  return (
    <Suspense>
      <SearchHome />
    </Suspense>
  );
}
