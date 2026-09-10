"use client";

import {
  type DiskProvider,
  defaultResourceSearchSort,
  diskProviderLabels,
  diskProviders,
  formatShanghai,
  hasShareTime,
  type Resource,
  type ResourceLink,
  type ResourceSearchResponse,
  type ResourceSearchSort,
  resourceSearchSortLabels,
  resourceSearchSorts,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import Link from "next/link";
import { createParser, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

const providers = diskProviders.map(
  (id) => [id, diskProviderLabels[id]] as const,
);
const providerValues = [...diskProviders] as [DiskProvider, ...DiskProvider[]];

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

const parseAsPage = createParser({
  parse(queryValue) {
    const n = Number.parseInt(queryValue, 10);
    if (!Number.isInteger(n) || n < 1) return 1;
    return n;
  },
  serialize(value) {
    return String(value);
  },
}).withDefault(1);

const pageSizes = [12, 24, 50] as const;
type PageSize = (typeof pageSizes)[number];
const defaultPageSize: PageSize = 12;

function isPageSize(value: number): value is PageSize {
  return pageSizes.includes(value as PageSize);
}

const parseAsPageSize = createParser({
  parse(queryValue) {
    const n = Number.parseInt(queryValue, 10);
    return isPageSize(n) ? n : defaultPageSize;
  },
  serialize(value) {
    return String(value);
  },
}).withDefault(defaultPageSize);

const parseAsSort = parseAsStringLiteral(resourceSearchSorts).withDefault(
  defaultResourceSearchSort,
);

export function SearchHome() {
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsSearchQ,
      provider: parseAsStringLiteral(providerValues),
      sort: parseAsSort,
      page: parseAsPage,
      pageSize: parseAsPageSize,
    },
    { history: "replace" },
  );
  const [draft, setDraft] = useState(filters.q);
  const [data, setData] = useState<ResourceSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);
  const resultsStatusRef = useRef<HTMLParagraphElement>(null);
  const scrolledViewRef = useRef<string | null>(null);
  const resultsViewKey = `${filters.sort}:${filters.page}:${filters.pageSize}`;

  useEffect(() => {
    setDraft(filters.q);
  }, [filters.q]);

  const queryString = useMemo(
    () =>
      searchQueryString({
        q: filters.q,
        provider: filters.provider,
        sort: filters.sort,
        page: filters.page,
        pageSize: filters.pageSize,
      }),
    [filters.page, filters.pageSize, filters.provider, filters.q, filters.sort],
  );

  useEffect(() => {
    if (!filters.q) {
      setData({
        items: [],
        total: 0,
        page: 1,
        pageSize: filters.pageSize,
      });
      setError(null);
      setPending(false);
      return;
    }
    let cancelled = false;
    setPending(true);
    setError(null);
    fetch(`/api/resources/search${queryString ? `?${queryString}` : ""}`, {
      credentials: "same-origin",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | ResourceSearchResponse
          | { error?: unknown }
          | null;
        if (!res.ok) {
          const message =
            body &&
            typeof body === "object" &&
            "error" in body &&
            typeof body.error === "string"
              ? body.error
              : "搜索失败";
          throw new Error(message);
        }
        return body as ResourceSearchResponse;
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
  }, [filters.pageSize, filters.q, queryString]);

  useEffect(() => {
    if (pending || !data || !filters.q || data.total === 0) return;
    const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
    if (filters.page > totalPages) {
      void setFilters({ page: totalPages });
    }
  }, [data, filters.page, filters.q, pending, setFilters]);

  useEffect(() => {
    if (pending) return;
    if (scrolledViewRef.current === null) {
      scrolledViewRef.current = resultsViewKey;
      return;
    }
    if (scrolledViewRef.current === resultsViewKey) return;
    scrolledViewRef.current = resultsViewKey;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    resultsRef.current?.scrollIntoView({
      block: "start",
      behavior: reduce ? "auto" : "smooth",
    });
    resultsStatusRef.current?.focus({ preventScroll: true });
  }, [pending, resultsViewKey]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = searchQSchema.safeParse(draft);
    void setFilters({
      q: parsed.success ? parsed.data : "",
      page: 1,
    });
  }

  return (
    <div
      data-slot="search-home"
      className="flex min-h-svh flex-col bg-background text-foreground"
    >
      {/* <header className="page-bleed sticky top-0 z-40 border-b bg-background pt-[env(safe-area-inset-top)]">
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
      </header> */}

      <main
        id="main"
        className="page-shell-wide flex flex-1 flex-col py-[clamp(2.5rem,1.8rem+3vw,5rem)] pb-[max(4rem,env(safe-area-inset-bottom))]"
      >
        <div className="page-prose">
          <h1 className="text-[clamp(1.75rem,1.4rem+1.6vw,2.25rem)] font-semibold tracking-tight">
            网盘妹-搜网盘资源
          </h1>
          <p className="mt-2 text-muted-foreground">
            聚合公开分享，点结果跳原盘。本站不收录、不存文件，也不代替网盘登录。
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
            disabled={pending}
            onClick={() => void setFilters({ provider: null, page: 1 })}
            label="全部"
          />
          {providers.map(([id, label]) => (
            <FilterChip
              key={id}
              active={filters.provider === id}
              disabled={pending}
              onClick={() => void setFilters({ provider: id, page: 1 })}
              label={label}
            />
          ))}
        </div>

        <section
          ref={resultsRef}
          id="search-results"
          className="mt-10"
          aria-busy={pending}
        >
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {pending ? (
            <ul className="space-y-3">
              {["s1", "s2", "s3"].map((id) => (
                <li key={id} className="rounded-lg border p-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="mt-2 h-4 w-full max-w-xl" />
                </li>
              ))}
            </ul>
          ) : null}
          {!pending && filters.q && data && data.total > 0 ? (
            <div
              data-slot="search-toolbar"
              className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
            >
              <p
                ref={resultsStatusRef}
                tabIndex={-1}
                aria-live="polite"
                className="text-sm text-muted-foreground outline-none"
              >
                {resultRangeText(data, filters.sort)}
              </p>
              <SortField
                sort={filters.sort}
                onSortChange={(sort) => {
                  void setFilters({ sort, page: 1 });
                }}
              />
            </div>
          ) : null}
          {!pending ? (
            <ul className="space-y-3">
              {(data?.items ?? []).map((item) => (
                <ResultCard key={item.id} item={item} />
              ))}
            </ul>
          ) : null}
          {!pending && !filters.q ? (
            <p className="text-sm text-muted-foreground">
              输入关键词搜索公开分享。
            </p>
          ) : null}
          {!pending &&
          filters.q &&
          data &&
          data.items.length === 0 &&
          !error ? (
            <p className="text-sm text-muted-foreground">
              没有匹配的分享。换个词再试。
            </p>
          ) : null}
          {!pending && data && data.total > 0 ? (
            <SearchPagination
              q={filters.q}
              provider={filters.provider}
              sort={filters.sort}
              page={data.page}
              pageSize={
                isPageSize(data.pageSize) ? data.pageSize : filters.pageSize
              }
              total={data.total}
              onPageChange={(page) => {
                void setFilters({ page }, { history: "push" });
              }}
              onPageSizeChange={(pageSize) => {
                void setFilters({ pageSize, page: 1 });
              }}
            />
          ) : null}
        </section>
      </main>
    </div>
  );
}

function SortField({
  sort,
  onSortChange,
}: {
  sort: ResourceSearchSort;
  onSortChange: (sort: ResourceSearchSort) => void;
}) {
  return (
    <fieldset data-slot="search-sort" className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">排序</legend>
      <div className="flex min-h-11 flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">排序</span>
        {resourceSearchSorts.map((value) => {
          const checked = sort === value;
          return (
            <label
              key={value}
              data-slot="sort-chip"
              data-active={checked ? "true" : "false"}
              className="inline-flex min-h-11 items-center"
            >
              <input
                type="radio"
                name="search-sort"
                value={value}
                checked={checked}
                onChange={() => {
                  if (!checked) onSortChange(value);
                }}
                className="peer sr-only"
              />
              <span
                className={
                  checked
                    ? "inline-flex h-8 items-center rounded-full bg-foreground px-3 text-sm text-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                    : "inline-flex h-8 items-center rounded-full border px-3 text-sm text-muted-foreground hover:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                }
              >
                {resourceSearchSortLabels[value]}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function FilterChip({
  active,
  label,
  onClick,
  disabled = false,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      data-slot="filter-chip"
      data-active={active ? "true" : "false"}
      aria-pressed={active}
      onClick={onClick}
      className="inline-flex min-h-11 items-center disabled:opacity-50"
    >
      <span
        className={
          active
            ? "inline-flex h-8 items-center rounded-full bg-foreground px-3 text-sm text-background"
            : disabled
              ? "inline-flex h-8 items-center rounded-full border px-3 text-sm text-muted-foreground"
              : "inline-flex h-8 items-center rounded-full border px-3 text-sm text-muted-foreground hover:text-foreground"
        }
      >
        {label}
      </span>
    </button>
  );
}

function searchQueryString(input: {
  q: string;
  provider: DiskProvider | null;
  sort: ResourceSearchSort;
  page: number;
  pageSize: PageSize;
}) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.provider) params.set("provider", input.provider);
  if (input.sort !== defaultResourceSearchSort) params.set("sort", input.sort);
  if (input.page > 1) params.set("page", String(input.page));
  if (input.pageSize !== defaultPageSize) {
    params.set("pageSize", String(input.pageSize));
  }
  return params.toString();
}

function searchHref(input: {
  q: string;
  provider: DiskProvider | null;
  sort: ResourceSearchSort;
  page: number;
  pageSize: PageSize;
}) {
  const qs = searchQueryString(input);
  return qs ? `/?${qs}` : "/";
}

function resultRangeText(
  data: ResourceSearchResponse,
  sort: ResourceSearchSort,
) {
  const from = (data.page - 1) * data.pageSize + 1;
  const to = (data.page - 1) * data.pageSize + data.items.length;
  return `第 ${from}–${to} 条，共 ${data.total} 条，按${resourceSearchSortLabels[sort]}`;
}

function paginationItems(
  current: number,
  totalPages: number,
): Array<number | "ellipsis-start" | "ellipsis-end"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: Array<number | "ellipsis-start" | "ellipsis-end"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) items.push("ellipsis-start");
  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }
  if (end < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
}

function SearchPagination({
  q,
  provider,
  sort,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  q: string;
  provider: DiskProvider | null;
  sort: ResourceSearchSort;
  page: number;
  pageSize: PageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hrefFor = (next: number) =>
    searchHref({ q, provider, sort, page: next, pageSize });
  return (
    <nav
      data-slot="search-pagination"
      aria-label="搜索结果分页"
      className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2"
    >
      <PageSizeField pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
      {totalPages > 1 ? (
        <>
          <span
            className="hidden h-4 w-px self-center bg-border sm:block"
            aria-hidden="true"
          />
          <ul className="flex flex-wrap items-center gap-2">
            <li>
              {page > 1 ? (
                <PageChip href={hrefFor(page - 1)} rel="prev">
                  上一页
                </PageChip>
              ) : (
                <PageChip disabled>上一页</PageChip>
              )}
            </li>
            <li className="sm:hidden">
              <span className="inline-flex min-h-11 items-center text-sm text-muted-foreground">
                第 {page} / {totalPages} 页
              </span>
            </li>
            {paginationItems(page, totalPages).map((item) =>
              item === "ellipsis-start" || item === "ellipsis-end" ? (
                <li key={item} className="hidden sm:flex" aria-hidden="true">
                  <span className="inline-flex min-h-11 min-w-8 items-center justify-center text-sm text-muted-foreground">
                    …
                  </span>
                </li>
              ) : (
                <li key={item} className="hidden sm:flex">
                  {item === page ? (
                    <PageChip current>{item}</PageChip>
                  ) : (
                    <PageChip href={hrefFor(item)}>{item}</PageChip>
                  )}
                </li>
              ),
            )}
            <li>
              {page < totalPages ? (
                <PageChip href={hrefFor(page + 1)} rel="next">
                  下一页
                </PageChip>
              ) : (
                <PageChip disabled>下一页</PageChip>
              )}
            </li>
          </ul>
          <span
            className="hidden h-4 w-px self-center bg-border sm:block"
            aria-hidden="true"
          />
          <PageJumpField
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      ) : null}
    </nav>
  );
}

function PageSizeField({
  pageSize,
  onPageSizeChange,
}: {
  pageSize: PageSize;
  onPageSizeChange: (pageSize: PageSize) => void;
}) {
  return (
    <fieldset data-slot="page-size-field" className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">每页显示条数</legend>
      <div className="flex min-h-11 flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">每页</span>
        {pageSizes.map((size) => (
          <FilterChip
            key={size}
            active={pageSize === size}
            label={`${size} 条`}
            onClick={() => {
              if (size !== pageSize) onPageSizeChange(size);
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}

function PageJumpField({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [draft, setDraft] = useState(String(page));
  useEffect(() => {
    setDraft(String(page));
  }, [page]);

  function submit() {
    const raw = Number.parseInt(draft, 10);
    if (!Number.isInteger(raw)) {
      setDraft(String(page));
      return;
    }
    const next = Math.min(totalPages, Math.max(1, raw));
    setDraft(String(next));
    if (next !== page) onPageChange(next);
  }

  return (
    <form
      data-slot="page-jump"
      className="flex min-h-11 items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Label
        htmlFor="search-page-jump"
        className="shrink-0 border-0 text-sm font-normal text-muted-foreground"
      >
        前往
      </Label>
      <Input
        id="search-page-jump"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={`前往第几页，共 ${totalPages} 页`}
        aria-describedby="search-page-jump-hint"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        className="h-8 w-14 shrink-0 rounded-sm bg-background text-center tabular-nums"
      />
      <span
        id="search-page-jump-hint"
        className="shrink-0 border-0 text-sm text-muted-foreground"
      >
        页
      </span>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="h-8 rounded-sm bg-background"
      >
        跳转
      </Button>
    </form>
  );
}

function PageChip({
  children,
  href,
  current = false,
  disabled = false,
  rel,
}: {
  children: React.ReactNode;
  href?: string;
  current?: boolean;
  disabled?: boolean;
  rel?: string;
}) {
  const visual = current
    ? "inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-foreground px-3 text-sm text-background"
    : "inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-3 text-sm text-muted-foreground hover:text-foreground";
  if (disabled || !href) {
    return (
      <span
        className="inline-flex min-h-11 items-center"
        aria-current={current ? "page" : undefined}
        aria-disabled={disabled ? true : undefined}
      >
        <span className={disabled ? `${visual} opacity-50` : visual}>
          {children}
        </span>
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      rel={rel}
      className="inline-flex min-h-11 items-center"
    >
      <span className={visual}>{children}</span>
    </Link>
  );
}

function uniqueLinks(links: ResourceLink[]): ResourceLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.provider)) return false;
    seen.add(link.provider);
    return true;
  });
}

function ResultCard({ item }: { item: Resource }) {
  const links = uniqueLinks(item.links);
  return (
    <li data-slot="result-card" className="@container rounded-lg border p-4">
      <h2 className="font-medium">{item.title}</h2>
      {item.description ? (
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
      ) : null}
      {links.length > 0 ? (
        <div data-slot="result-links" className="mt-3 flex flex-wrap gap-2">
          {links.map((link) => (
            <DiskLinkChip
              key={`${link.provider}-${link.shareUrl}`}
              link={link}
            />
          ))}
        </div>
      ) : null}
      {item.tags || hasShareTime(item.createdAt) ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {[
            item.tags || null,
            hasShareTime(item.createdAt)
              ? formatShanghai(item.createdAt)
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
    </li>
  );
}

function DiskLinkChip({ link }: { link: ResourceLink }) {
  const label = link.shareCode
    ? `${diskProviderLabels[link.provider]} · ${link.shareCode}`
    : diskProviderLabels[link.provider];
  return (
    <a
      href={link.shareUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-slot="disk-link-chip"
      className="inline-flex min-h-11 items-center"
    >
      <span className="inline-flex h-8 items-center rounded-full border px-3 text-sm text-muted-foreground hover:text-foreground">
        {label}
      </span>
    </a>
  );
}
