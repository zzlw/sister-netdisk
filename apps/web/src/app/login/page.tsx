import { LoginForm } from "@repo/ui/components/login-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "登录",
  description: "使用邮箱登录网盘妹。",
};

export default function LoginPage() {
  return (
    <main
      id="main"
      className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-10"
    >
      <div className="w-full max-w-sm md:max-w-4xl">
        <Suspense>
          <LoginForm audience="customer" />
        </Suspense>
      </div>
    </main>
  );
}
