import { createHash } from "node:crypto";
import type {
  DiskProvider,
  Resource,
  ResourceLink,
  ResourceSearchQuery,
  ResourceSearchSort,
} from "@repo/shared";

const discardedTypes = new Set(["magnet", "ed2k"]);
const knownProviders = new Set<string>([
  "baidu",
  "aliyun",
  "quark",
  "tianyi",
  "115",
  "uc",
  "123",
  "xunlei",
  "pikpak",
  "weiyun",
  "lanzou",
  "mobile",
  "guangya",
  "other",
]);

export function resourceIdFromUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 32);
}

export function resourceIdFromTitle(title: string): string {
  return createHash("sha256")
    .update(`title:${title}`)
    .digest("hex")
    .slice(0, 32);
}

export function hashQuery(q: string): string {
  return createHash("sha256").update(q).digest("hex").slice(0, 12);
}

export function csvList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

export function cloudTypesForProvider(
  provider: DiskProvider | undefined,
): string[] | undefined {
  if (!provider || provider === "other") return undefined;
  return [provider];
}

export function normalizeShareUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function foldKey(title: string): string | null {
  const key = title.trim().replace(/\s+/g, " ");
  if (!key || key === "网盘分享") return null;
  return key;
}

export function mapUpstreamProvider(
  rawType: string,
): { provider: DiskProvider; original: string | null } | null {
  const type = rawType.trim().toLowerCase();
  if (!type || discardedTypes.has(type)) return null;
  if (knownProviders.has(type)) {
    return { provider: type as DiskProvider, original: null };
  }
  if (type === "others") {
    return { provider: "other", original: type };
  }
  return { provider: "other", original: type };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

const unknownShareTime = new Date(0);

function hasKnownShareTime(date: Date): boolean {
  const t = date.getTime();
  return Number.isFinite(t) && t > 0 && date.getUTCFullYear() >= 1970;
}

function parseTime(value: unknown): Date {
  const raw = asString(value).trim();
  if (!raw) return unknownShareTime;
  const date = new Date(raw);
  return hasKnownShareTime(date) ? date : unknownShareTime;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

function isHttpUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function sourceTag(source: unknown): string {
  const raw = asString(source).trim();
  if (!raw) return "";
  const idx = raw.indexOf(":");
  return idx >= 0 ? raw.slice(idx + 1) : raw;
}

function joinTags(...parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(",");
}

function toLink(
  card: Pick<Resource, "provider" | "shareUrl" | "shareCode">,
): ResourceLink {
  return {
    provider: card.provider,
    shareUrl: card.shareUrl,
    shareCode: card.shareCode,
  };
}

function withPrimary(
  card: Omit<Resource, "provider" | "shareUrl" | "shareCode"> & {
    links: ResourceLink[];
  },
): Resource {
  const primary = card.links[0];
  return {
    ...card,
    provider: primary.provider,
    shareUrl: primary.shareUrl,
    shareCode: primary.shareCode,
  };
}

export function unwrapPansouPayload(body: unknown): {
  mergedByType: Record<string, unknown[]>;
  results: unknown[];
} {
  const root = asRecord(body) ?? {};
  const data = asRecord(root.data) ?? root;
  const merged = asRecord(data.merged_by_type) ?? {};
  const mergedByType: Record<string, unknown[]> = {};
  for (const [key, value] of Object.entries(merged)) {
    if (Array.isArray(value)) mergedByType[key] = value;
  }
  return {
    mergedByType,
    results: Array.isArray(data.results) ? data.results : [],
  };
}

function cardFromLink(opts: {
  url: string;
  password: string;
  title: string;
  description: string;
  tags: string;
  provider: DiskProvider;
  datetime: unknown;
}): Resource | null {
  if (!isHttpUrl(opts.url.trim())) return null;
  const shareUrl = normalizeShareUrl(opts.url);
  if (!isHttpUrl(shareUrl)) return null;
  const title =
    opts.title.trim() || truncate(opts.description, 80) || "网盘分享";
  const createdAt = parseTime(opts.datetime);
  const link = {
    provider: opts.provider,
    shareUrl,
    shareCode: opts.password.trim(),
  };
  return {
    id: resourceIdFromUrl(shareUrl),
    title: truncate(title, 120),
    description: truncate(opts.description.trim(), 500),
    provider: link.provider,
    shareUrl: link.shareUrl,
    shareCode: link.shareCode,
    links: [link],
    tags: truncate(opts.tags, 120),
    published: true,
    createdAt,
    updatedAt: createdAt,
  };
}

function mapMergedLink(rawType: string, item: unknown): Resource | null {
  const mapped = mapUpstreamProvider(rawType);
  if (!mapped) return null;
  const row = asRecord(item);
  if (!row) return null;
  const note = asString(row.note);
  return cardFromLink({
    url: asString(row.url),
    password: asString(row.password),
    title: note,
    description: "",
    tags: joinTags(sourceTag(row.source), mapped.original),
    provider: mapped.provider,
    datetime: row.datetime,
  });
}

function mapResultItem(item: unknown): Resource[] {
  const row = asRecord(item);
  if (!row) return [];
  const title = asString(row.title);
  const content = asString(row.content);
  const channel = asString(row.channel);
  const links = Array.isArray(row.links) ? row.links : [];
  const cards: Resource[] = [];
  for (const link of links) {
    const rec = asRecord(link);
    if (!rec) continue;
    const mapped = mapUpstreamProvider(asString(rec.type));
    if (!mapped) continue;
    const card = cardFromLink({
      url: asString(rec.url),
      password: asString(rec.password),
      title: asString(rec.work_title) || title,
      description: content,
      tags: joinTags(channel, mapped.original),
      provider: mapped.provider,
      datetime: rec.datetime ?? row.datetime,
    });
    if (card) cards.push(card);
  }
  return cards;
}

export function dedupeByUrl(items: Resource[]): Resource[] {
  const seen = new Set<string>();
  const out: Resource[] = [];
  for (const item of items) {
    const url = normalizeShareUrl(item.shareUrl);
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(item);
  }
  return out;
}

export function uniqueLinksByProvider(links: ResourceLink[]): ResourceLink[] {
  const seen = new Set<string>();
  const out: ResourceLink[] = [];
  for (const link of links) {
    if (seen.has(link.provider)) continue;
    seen.add(link.provider);
    out.push(link);
  }
  return out;
}

export function foldByTitle(items: Resource[]): Resource[] {
  const order: Resource[] = [];
  const groups = new Map<string, Resource>();

  for (const item of items) {
    const key = foldKey(item.title);
    if (!key) {
      order.push(item);
      continue;
    }
    const existing = groups.get(key);
    if (!existing) {
      const card = withPrimary({
        ...item,
        id: resourceIdFromTitle(key),
        title: key,
        links: [toLink(item)],
      });
      groups.set(key, card);
      order.push(card);
      continue;
    }
    const url = normalizeShareUrl(item.shareUrl);
    if (
      existing.links.some(
        (link) => link.shareUrl === url || link.provider === item.provider,
      )
    ) {
      continue;
    }
    existing.links.push(toLink(item));
    existing.tags = truncate(joinTags(existing.tags, item.tags), 120);
    if (!existing.description && item.description) {
      existing.description = item.description;
    }
    if (item.createdAt < existing.createdAt) {
      existing.createdAt = item.createdAt;
    }
    existing.updatedAt = existing.createdAt;
  }

  return order;
}

export function mapPansouToResources(body: unknown, _now?: Date): Resource[] {
  const { mergedByType, results } = unwrapPansouPayload(body);
  const cards: Resource[] = [];

  if (Object.keys(mergedByType).length > 0) {
    for (const [type, items] of Object.entries(mergedByType)) {
      for (const item of items) {
        const card = mapMergedLink(type, item);
        if (card) cards.push(card);
      }
    }
  } else {
    for (const item of results) {
      cards.push(...mapResultItem(item));
    }
  }

  return foldByTitle(dedupeByUrl(cards)).map((card) =>
    withPrimary({
      ...card,
      links: uniqueLinksByProvider(card.links),
    }),
  );
}

export function dropDeadLinks(
  items: Resource[],
  isDead: (url: string) => boolean,
): Resource[] {
  return items.flatMap((item) => {
    const links = item.links.filter(
      (link) => !isDead(normalizeShareUrl(link.shareUrl)),
    );
    if (links.length === 0) return [];
    return [withPrimary({ ...item, links })];
  });
}

export function filterByProvider(
  items: Resource[],
  provider: ResourceSearchQuery["provider"],
): Resource[] {
  if (!provider) return items;
  return items.flatMap((item) => {
    const links = item.links.filter((link) => link.provider === provider);
    if (links.length === 0) return [];
    return [withPrimary({ ...item, links })];
  });
}

export function sortResources(
  items: Resource[],
  sort: ResourceSearchSort | undefined,
): Resource[] {
  if (!sort || sort === "relevance") return items;
  const indexed = items.map((item, index) => ({ item, index }));
  const newest = sort === "newest";
  indexed.sort((a, b) => {
    const aKnown = hasKnownShareTime(a.item.createdAt);
    const bKnown = hasKnownShareTime(b.item.createdAt);
    if (aKnown !== bKnown) return aKnown ? -1 : 1;
    if (!aKnown) return a.index - b.index;
    const delta = a.item.createdAt.getTime() - b.item.createdAt.getTime();
    if (delta !== 0) return newest ? -delta : delta;
    return a.index - b.index;
  });
  return indexed.map((row) => row.item);
}

export function paginateResources(
  items: Resource[],
  query: Pick<ResourceSearchQuery, "page" | "pageSize"> &
    Partial<Pick<ResourceSearchQuery, "provider" | "sort">>,
) {
  const filtered = filterByProvider(items, query.provider);
  const sorted = sortResources(filtered, query.sort);
  const start = (query.page - 1) * query.pageSize;
  return {
    items: sorted.slice(start, start + query.pageSize),
    total: sorted.length,
    page: query.page,
    pageSize: query.pageSize,
  };
}
