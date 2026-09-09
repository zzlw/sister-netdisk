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
      className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-3 px-4"
    >
      <h1 className="text-xl font-semibold">出错了</h1>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <Button type="button" onClick={reset}>
        重试
      </Button>
    </main>
  );
}
