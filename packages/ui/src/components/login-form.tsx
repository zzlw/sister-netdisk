"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { authClient } from "@repo/ui/lib/auth-client";
import { cn } from "@repo/ui/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { type ComponentProps, useState } from "react";

export function LoginForm({
  audience = "customer",
  className,
  ...props
}: ComponentProps<"div"> & { audience?: "customer" | "staff" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staff = audience === "staff";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const next = searchParams.get("next") || "/";
    if (staff && mode === "signup") {
      setPending(false);
      setError("后台不开放注册");
      return;
    }
    const result =
      mode === "signup"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({
            email,
            password,
            rememberMe: true,
          });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "登录失败");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">
                  {mode === "login" ? "登录" : "注册"}
                </h1>
                <p className="text-balance text-muted-foreground">
                  {staff
                    ? "员工账号登录后台，会员账号进不来"
                    : mode === "login"
                      ? "本地会员 user@example.com / password，员工请走后台"
                      : "注册后是会员，不会成为管理员"}
                </p>
              </div>
              {mode === "signup" ? (
                <Field>
                  <FieldLabel htmlFor="name">名称</FieldLabel>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="email">邮箱</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">密码</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </Field>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "请稍候…" : mode === "login" ? "登录" : "注册"}
                </Button>
              </Field>
              {staff ? (
                <FieldDescription className="text-center">
                  本地员工：<code>pnpm db:seed</code>，
                  <code>admin@example.com</code> / <code>password</code>
                </FieldDescription>
              ) : (
                <FieldDescription className="text-center">
                  {mode === "login" ? (
                    <>
                      还没有会员账号？{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => setMode("signup")}
                      >
                        注册
                      </button>
                    </>
                  ) : (
                    <>
                      已有账号？{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => setMode("login")}
                      >
                        登录
                      </button>
                    </>
                  )}
                </FieldDescription>
              )}
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-800 dark:to-zinc-950" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
