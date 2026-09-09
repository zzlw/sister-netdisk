import { LoginForm } from "@repo/ui/components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main
      id="main"
      className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10"
    >
      <div className="w-full max-w-sm md:max-w-4xl">
        <Suspense>
          <LoginForm audience="staff" />
        </Suspense>
      </div>
    </main>
  );
}
