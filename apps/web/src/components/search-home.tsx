"use client";

import {
  type DiskProvider,
  diskProviderLabels,
  diskProviderSchema,
  formatShanghai,
  type Resource,
  type ResourceSearchResponse,
} from "@repo/shared";
import { Button, buttonVariants } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import Link from "next/link";
import { createParser, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

const providers = Object.entries(diskProviderLabels) as [
  DiskProvider,
  string,
][];
const providerValues = diskProviderSchema.options as [
  DiskProvider,
  ...DiskProvider[],
];

const searchQSchema = z.string().trim().max(80);
const parseAsSearchQ = createParser({
  parse(queryValue) {
    const result = searchQSchema.safeParse(queryValue);
    return result.success ? result.data : "";
  },
  serialize(value) {
    return value;
  },
}).withDefault("");

export function SearchHome() {
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsSearchQ,
      provider: parseAsStringLiteral(providerValues),
    },
    { history: "replace" },
  );
  const [draft, setDraft] = useState(filters.q);
  const [data, setData] = useState<ResourceSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setDraft(filters.q);
  }, [filters.q]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.provider) params.set("provider", filters.provider);
    return params.toString();
  }, [filters.provider, filters.q]);

  useEffect(() => {
    let cancelled = false;
    setPending(true);
    setError(null);
    fetch(`/api/resources/search${queryString ? `?${queryString}` : ""}`, {
      credentials: "same-origin",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("搜索失败");
        return (await res.json()) as ResourceSearchResponse;
      })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = searchQSchema.safeParse(draft);
    void setFilters({ q: parsed.success ? parsed.data : "" });
  }

  return (
    <div
      data-slot="search-home"
      className="flex min-h-svh flex-col bg-background text-foreground"
    >
      <header className="page-bleed sticky top-0 z-40 border-b bg-background pt-[env(safe-area-inset-top)]">
        <div className="page-shell-wide flex min-h-14 items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">网盘妹</span>
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center px-2 hover:text-foreground"
            >
              登录
            </Link>
            <Link
              href="/account"
              className="inline-flex min-h-11 items-center px-2 hover:text-foreground"
            >
              个人中心
            </Link>
          </nav>
        </div>
      </header>

      <main
        id="main"
        className="page-shell-wide flex flex-1 flex-col py-[clamp(2.5rem,1.8rem+3vw,5rem)] pb-[max(4rem,env(safe-area-inset-bottom))]"
      >
        <div className="page-prose">
          <h1 className="text-[clamp(1.75rem,1.4rem+1.6vw,2.25rem)] font-semibold tracking-tight">
            搜网盘资源
          </h1>
          <p className="mt-2 text-muted-foreground">
            在已收录的分享里搜索，点结果会跳到对应网盘。本站不存文件，也不代替网盘登录。
          </p>
        </div>

        <form data-slot="search-form" onSubmit={onSubmit} className="mt-8">
          <Label htmlFor="search-q">关键词</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              id="search-q"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="例如 线性代数、字体、Python"
            />
            <Button type="submit" size="lg" disabled={pending}>
              搜索
            </Button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip
            active={!filters.provider}
            onClick={() => void setFilters({ provider: null })}
            label="全部"
          />
          {providers.map(([id, label]) => (
            <FilterChip
              key={id}
              active={filters.provider === id}
              onClick={() => void setFilters({ provider: id })}
              label={label}
            />
          ))}
        </div>

        <section className="mt-10">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {pending && !data ? (
            <p className="text-sm text-muted-foreground">搜索中…</p>
          ) : null}
          {data ? (
            <p className="mb-4 text-sm text-muted-foreground">
              共 {data.total} 条
            </p>
          ) : null}
          <ul className="space-y-3">
            {(data?.items ?? []).map((item) => (
              <ResultCard key={item.id} item={item} />
            ))}
          </ul>
          {data && data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              没有匹配的资源。换个词，或到后台录入分享链接。
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-slot="filter-chip"
      data-active={active ? "true" : "false"}
      onClick={onClick}
      className="inline-flex min-h-11 items-center"
    >
      <span
        className={
          active
            ? "inline-flex h-8 items-center rounded-full bg-foreground px-3 text-sm text-background"
            : "inline-flex h-8 items-center rounded-full border px-3 text-sm text-muted-foreground hover:text-foreground"
        }
      >
        {label}
      </span>
    </button>
  );
}

function ResultCard({ item }: { item: Resource }) {
  const label = diskProviderLabels[item.provider];
  return (
    <li data-slot="result-card" className="@container rounded-lg border p-4">
      <div className="flex flex-col gap-3 @min-[32rem]:flex-row @min-[32rem]:items-start @min-[32rem]:justify-between">
        <div className="min-w-0">
          <h2 className="font-medium">{item.title}</h2>
          {item.description ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {item.description}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {label}
            {item.shareCode ? ` · 提取码 ${item.shareCode}` : ""}
            {item.tags ? ` · ${item.tags}` : ""}
            {` · ${formatShanghai(item.createdAt)}`}
          </p>
        </div>
        <div className="inline-flex min-h-11 shrink-0 items-center self-start">
          <a
            href={item.shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants()}
          >
            打开网盘
          </a>
        </div>
      </div>
    </li>
  );
}
