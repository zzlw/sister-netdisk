import { buttonVariants } from "@repo/ui/components/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main"
      className="page-shell flex min-h-svh flex-col justify-center"
    >
      <div className="page-prose flex flex-col gap-3">
        <h1 className="text-xl font-semibold">页面不存在</h1>
        <p className="text-muted-foreground text-sm">这个地址没有对应页面。</p>
        <Link href="/" className={buttonVariants({ className: "w-fit" })}>
          回首页
        </Link>
      </div>
    </main>
  );
}
