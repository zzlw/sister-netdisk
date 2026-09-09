"use client";

import { Button } from "@repo/ui/components/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main"
      className="page-shell flex min-h-svh flex-col justify-center"
    >
      <div className="page-prose flex flex-col gap-3">
        <h1 className="text-xl font-semibold">出错了</h1>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <Button type="button" onClick={reset} className="w-fit">
          重试
        </Button>
      </div>
    </main>
  );
}
