import type { Resource, ResourceSearchQuery } from "@repo/shared";
import { searchPansou } from "./pansou-client";
import {
  csvList,
  dropDeadLinks,
  filterByProvider,
  hashQuery,
  mapPansouToResources,
  paginateResources,
  sortResources,
} from "./pansou-map";
import { searchEnv } from "./search-env";
import { ShareLiveness } from "./share-liveness";
import { TtlCache } from "./ttl-cache";

let cache: TtlCache<Resource[]> | undefined;
let liveness: ShareLiveness | undefined;

function resultsCache() {
  cache ??= new TtlCache<Resource[]>(searchEnv().PANSOU_CACHE_TTL_MS);
  return cache;
}

function shareLiveness() {
  if (!liveness) {
    const env = searchEnv();
    liveness = new ShareLiveness(
      {
        enabled: env.SHARE_CHECK_ENABLED,
        timeoutMs: env.SHARE_CHECK_TIMEOUT_MS,
        concurrency: env.SHARE_CHECK_CONCURRENCY,
        budgetMs: env.SHARE_CHECK_BUDGET_MS,
        deadTtlMs: env.SHARE_DEAD_TTL_MS,
        skipTtlMs: env.SHARE_SKIP_TTL_MS,
      },
      globalThis.fetch.bind(globalThis),
    );
  }
  return liveness;
}

export async function searchResources(query: ResourceSearchQuery) {
  const page = query.page;
  const pageSize = query.pageSize;
  const q = query.q.trim();
  if (!q) {
    return { items: [], total: 0, page, pageSize };
  }

  const started = Date.now();
  const cacheKey = q;
  let mapped = resultsCache().get(cacheKey);
  const cacheHit = Boolean(mapped);
  if (!mapped) {
    const env = searchEnv();
    const payload: Record<string, unknown> = {
      kw: q,
      src: "all",
      res: "merge",
    };
    const channels = csvList(env.PANSOU_CHANNELS);
    if (channels) payload.channels = channels;
    const plugins = csvList(env.PANSOU_PLUGINS);
    if (plugins) payload.plugins = plugins;
    const body = await searchPansou(payload);
    mapped = mapPansouToResources(body);
    if (mapped.length > 0) {
      resultsCache().set(cacheKey, mapped);
    }
  }

  const scoped = sortResources(
    filterByProvider(mapped, query.provider),
    query.sort,
  );
  const live = shareLiveness();
  const swept = await live.sweep(scoped, page, pageSize);
  const cleaned = dropDeadLinks(mapped, (url) => live.isDead(url));
  if (cleaned.length > 0) {
    resultsCache().set(cacheKey, cleaned);
  }
  const result = paginateResources(swept.items, {
    page,
    pageSize,
    sort: query.sort,
  });
  console.info(
    `search q=${hashQuery(q)} provider=${query.provider ?? "-"} sort=${query.sort} cache=${cacheHit ? "hit" : "miss"} ms=${Date.now() - started} items=${result.total} dropped=${swept.dropped} probed=${swept.probed}`,
  );
  return result;
}
