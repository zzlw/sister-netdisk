import { Injectable, Logger } from "@nestjs/common";
import type { Resource, ResourceSearchQuery } from "@repo/shared";
import { env } from "./env";
import { PansouClient } from "./pansou.client";
import {
  csvList,
  dropDeadLinks,
  filterByProvider,
  hashQuery,
  mapPansouToResources,
  paginateResources,
  sortResources,
} from "./pansou-map";
import { ShareLivenessService } from "./share-liveness.service";
import { TtlCache } from "./ttl-cache";

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);
  private readonly cache = new TtlCache<Resource[]>(env.PANSOU_CACHE_TTL_MS);

  constructor(
    private readonly pansou: PansouClient,
    private readonly liveness: ShareLivenessService,
  ) {}

  async search(query: ResourceSearchQuery) {
    const page = query.page;
    const pageSize = query.pageSize;
    const q = query.q.trim();
    if (!q) {
      return { items: [], total: 0, page, pageSize };
    }

    const started = Date.now();
    const cacheKey = q;
    let mapped = this.cache.get(cacheKey);
    const cacheHit = Boolean(mapped);
    if (!mapped) {
      const payload: Record<string, unknown> = {
        kw: q,
        src: "all",
        res: "merge",
      };
      const channels = csvList(env.PANSOU_CHANNELS);
      if (channels) payload.channels = channels;
      const plugins = csvList(env.PANSOU_PLUGINS);
      if (plugins) payload.plugins = plugins;
      const body = await this.pansou.search(payload);
      mapped = mapPansouToResources(body);
      // 冷启动半醒时上游可能给空结果，缓存会把后续正常搜索也挡住。
      if (mapped.length > 0) {
        this.cache.set(cacheKey, mapped);
      }
    }

    const scoped = sortResources(
      filterByProvider(mapped, query.provider),
      query.sort,
    );
    const swept = await this.liveness.sweep(scoped, page, pageSize);
    const cleaned = dropDeadLinks(mapped, (url) => this.liveness.isDead(url));
    if (cleaned.length > 0) {
      this.cache.set(cacheKey, cleaned);
    }
    const result = paginateResources(swept.items, {
      page,
      pageSize,
      sort: query.sort,
    });
    this.logger.log(
      `search q=${hashQuery(q)} provider=${query.provider ?? "-"} sort=${query.sort} cache=${cacheHit ? "hit" : "miss"} ms=${Date.now() - started} items=${result.total} dropped=${swept.dropped} probed=${swept.probed}`,
    );
    return result;
  }
}
