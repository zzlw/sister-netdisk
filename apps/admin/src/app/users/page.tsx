"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Field, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
};

async function loadUsers(): Promise<Row[]> {
  const res = await fetch("/api/users", { credentials: "same-origin" });
  if (!res.ok) {
    throw new Error("无法加载用户");
  }
  return res.json();
}

export default function UsersPage() {
  const [q, setQ] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ history: "replace" }),
  );
  const { data, error, isPending, isRefetching, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: loadUsers,
  });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter(
      (row) =>
        !needle ||
        row.email.toLowerCase().includes(needle) ||
        row.name.toLowerCase().includes(needle),
    );
  }, [data, q]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">用户</h1>
          <p className="text-sm text-muted-foreground">
            会员和员工在同一张表，用角色区分。
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          刷新
        </Button>
      </div>

      <Card data-slot="user-filters">
        <CardHeader>
          <CardTitle>筛选</CardTitle>
          <CardDescription>可分享的筛选会进地址栏。</CardDescription>
        </CardHeader>
        <CardContent>
          <Field className="max-w-sm">
            <FieldLabel htmlFor="user-filter-q">邮箱 / 姓名</FieldLabel>
            <Input
              id="user-filter-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="可分享的筛选会进地址栏"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>全部用户</CardTitle>
          <CardDescription>
            {isPending ? "加载中" : `共 ${rows.length} 人`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-8 text-sm text-destructive">
              {error instanceof Error ? error.message : "加载失败"}
              ，点右上角刷新重试。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邮箱</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead className="w-24">角色</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  ["s1", "s2", "s3", "s4", "s5"].map((id) => (
                    <TableRow key={id}>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      {data && data.length > 0
                        ? "没有匹配的用户。"
                        : "还没有用户。先跑 pnpm db:seed。"}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.email}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {row.role === "admin" ? "员工" : "会员"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
