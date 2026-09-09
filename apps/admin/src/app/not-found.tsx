import { buttonVariants } from "@repo/ui/components/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-3 px-4"
    >
      <h1 className="text-xl font-semibold">页面不存在</h1>
      <p className="text-muted-foreground text-sm">这个地址没有对应页面。</p>
      <Link
        href="/resources"
        className={buttonVariants({ className: "w-fit" })}
      >
        回资源
      </Link>
    </main>
  );
}
