"use client";

import {
  type CreateResourceInput,
  type DiskProvider,
  diskProviderLabels,
  formatShanghai,
  type Resource,
} from "@repo/shared";
import { Button, buttonVariants } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Field, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";

const providers = Object.entries(diskProviderLabels) as [
  DiskProvider,
  string,
][];
const providerValues = providers.map(([id]) => id) as [
  DiskProvider,
  ...DiskProvider[],
];

async function loadResources(): Promise<Resource[]> {
  const res = await fetch("/api/resources", { credentials: "same-origin" });
  if (!res.ok) throw new Error("无法加载资源");
  return res.json();
}

async function createResource(input: CreateResourceInput): Promise<Resource> {
  const res = await fetch("/api/resources", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("录入失败");
  return res.json();
}

async function removeResource(id: string) {
  const res = await fetch(`/api/resources/${id}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("删除失败");
}

export default function ResourcesPage() {
  const client = useQueryClient();
  const list = useQuery({ queryKey: ["resources"], queryFn: loadResources });
  const create = useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["resources"] });
      resetForm();
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: removeResource,
    onSuccess: () => client.invalidateQueries({ queryKey: ["resources"] }),
  });

  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      provider: parseAsStringLiteral(providerValues),
    },
    { history: "replace" },
  );

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState<DiskProvider>("baidu");

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return (list.data ?? []).filter((row) => {
      const hitQ =
        !q ||
        row.title.toLowerCase().includes(q) ||
        row.tags.toLowerCase().includes(q);
      const hitP = !filters.provider || row.provider === filters.provider;
      return hitQ && hitP;
    });
  }, [filters.provider, filters.q, list.data]);

  function resetForm() {
    setTitle("");
    setShareUrl("");
    setShareCode("");
    setTags("");
    setDescription("");
    setProvider("baidu");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      title,
      shareUrl,
      shareCode,
      tags,
      description,
      provider,
      published: true,
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">资源</h1>
          <p className="text-sm text-muted-foreground">
            收录网盘分享。本站不存文件。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => list.refetch()}
            disabled={list.isRefetching}
          >
            刷新
          </Button>
          <Button onClick={() => setOpen(true)}>录入资源</Button>
        </div>
      </div>

      <Card data-slot="resource-filters">
        <CardHeader>
          <CardTitle>筛选</CardTitle>
          <CardDescription>可分享的筛选会进地址栏。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Field className="max-w-sm">
            <FieldLabel htmlFor="resource-filter-q">标题 / 标签</FieldLabel>
            <Input
              id="resource-filter-q"
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              placeholder="可分享的筛选会进地址栏"
            />
          </Field>
          <Field className="max-w-sm">
            <FieldLabel htmlFor="resource-filter-provider">网盘</FieldLabel>
            <Select
              value={filters.provider ?? "all"}
              items={[
                { label: "全部", value: "all" },
                ...providers.map(([id, label]) => ({ label, value: id })),
              ]}
              onValueChange={(value) => {
                if (value === null) return;
                setFilters({
                  provider: value === "all" ? null : (value as DiskProvider),
                });
              }}
            >
              <SelectTrigger id="resource-filter-provider" className="w-full">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {providers.map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已收录</CardTitle>
          <CardDescription>
            {list.isPending ? "加载中" : `共 ${rows.length} 条`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {list.error ? (
            <p className="py-8 text-sm text-destructive">
              {list.error instanceof Error ? list.error.message : "加载失败"}
              ，点右上角刷新重试。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>网盘</TableHead>
                  <TableHead>提取码</TableHead>
                  <TableHead>录入时间</TableHead>
                  <TableHead className="w-32 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isPending ? (
                  ["s1", "s2", "s3", "s4", "s5"].map((id) => (
                    <TableRow key={id}>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-4 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      {list.data && list.data.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          没有匹配的资源。
                        </p>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-sm text-muted-foreground">
                            还没有资源。
                          </p>
                          <Button onClick={() => setOpen(true)}>
                            录入资源
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.title}</TableCell>
                      <TableCell>{diskProviderLabels[row.provider]}</TableCell>
                      <TableCell>{row.shareCode || "—"}</TableCell>
                      <TableCell>{formatShanghai(row.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <a
                          className={buttonVariants({
                            variant: "link",
                            size: "sm",
                          })}
                          href={row.shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          打开
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(row.id)}
                        >
                          删除
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-xl" data-slot="resource-create">
          <DialogHeader>
            <DialogTitle>录入资源</DialogTitle>
            <DialogDescription>
              填分享链接即可。本站不存文件。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4">
            <Field className="max-w-sm">
              <FieldLabel htmlFor="resource-title">标题</FieldLabel>
              <Input
                id="resource-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Field>
            <Field className="max-w-sm">
              <FieldLabel htmlFor="resource-provider">网盘</FieldLabel>
              <Select
                value={provider}
                items={providers.map(([id, label]) => ({ label, value: id }))}
                onValueChange={(value) => {
                  if (value) setProvider(value as DiskProvider);
                }}
              >
                <SelectTrigger id="resource-provider" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field className="max-w-xl">
              <FieldLabel htmlFor="resource-url">分享链接</FieldLabel>
              <Input
                id="resource-url"
                type="url"
                value={shareUrl}
                onChange={(e) => setShareUrl(e.target.value)}
                placeholder="https://"
                required
              />
            </Field>
            <Field className="max-w-sm">
              <FieldLabel htmlFor="resource-code">提取码</FieldLabel>
              <Input
                id="resource-code"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value)}
              />
            </Field>
            <Field className="max-w-sm">
              <FieldLabel htmlFor="resource-tags">标签</FieldLabel>
              <Input
                id="resource-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="教材,数学"
              />
            </Field>
            <Field className="max-w-xl">
              <FieldLabel htmlFor="resource-desc">简介</FieldLabel>
              <Input
                id="resource-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            {create.error ? (
              <p className="text-sm text-destructive">
                {create.error instanceof Error
                  ? create.error.message
                  : "录入失败"}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "保存中…" : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
