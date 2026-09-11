import type { Resource } from "@repo/shared";
import { dropDeadLinks, normalizeShareUrl } from "./pansou-map";
import { TtlCache } from "./ttl-cache";

const deadMarkers = [
  "该分享已失效",
  "分享已失效",
  "分享的文件已经被删除",
  "分享的文件不存在",
  "文件不存在或已被取消",
  "文件已经被取消分享",
  "来晚了，文件已经被取消",
  "啊哦，来晚了",
  "该文件已取消分享",
  "链接已失效",
  "分享不存在",
];

const maxHtmlBytes = 256_000;

export type ShareLivenessOptions = {
  enabled: boolean;
  timeoutMs: number;
  concurrency: number;
  budgetMs: number;
  deadTtlMs: number;
  skipTtlMs: number;
};

export function htmlLooksExpired(html: string): boolean {
  const text = html.replace(/\s+/g, " ");
  return deadMarkers.some((marker) => text.includes(marker));
}

export function collectWindowUrls(
  items: Resource[],
  page: number,
  pageSize: number,
): string[] {
  const start = Math.max(0, (page - 1) * pageSize);
  const window = items.slice(start, start + pageSize * 2);
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const item of window) {
    for (const link of item.links) {
      const url = normalizeShareUrl(link.shareUrl);
      if (seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

export class ShareLiveness {
  private readonly dead: TtlCache<true>;
  private readonly skip: TtlCache<true>;
  private readonly inflight = new Map<string, Promise<boolean>>();

  constructor(
    private readonly opts: ShareLivenessOptions,
    private readonly request: typeof fetch,
  ) {
    this.dead = new TtlCache<true>(opts.deadTtlMs, 4096);
    this.skip = new TtlCache<true>(opts.skipTtlMs, 4096);
  }

  isDead(url: string): boolean {
    return this.dead.get(normalizeShareUrl(url)) === true;
  }

  async sweep(items: Resource[], page: number, pageSize: number) {
    const known = dropDeadLinks(items, (url) => this.isDead(url));
    if (!this.opts.enabled) {
      return { items: known, dropped: items.length - known.length, probed: 0 };
    }
    const pending = collectWindowUrls(known, page, pageSize).filter(
      (url) => !this.skip.get(url) && !this.isDead(url),
    );
    const probed = await this.probeMany(pending);
    const next = dropDeadLinks(known, (url) => this.isDead(url));
    return {
      items: next,
      dropped: items.length - next.length,
      probed,
    };
  }

  private async probeMany(urls: string[]): Promise<number> {
    if (urls.length === 0) return 0;
    const deadline = Date.now() + this.opts.budgetMs;
    let index = 0;
    let probed = 0;
    const workers = Array.from(
      { length: Math.min(this.opts.concurrency, urls.length) },
      async () => {
        while (index < urls.length && Date.now() < deadline) {
          const url = urls[index];
          index += 1;
          if (!url) continue;
          const dead = await this.probe(url);
          probed += 1;
          if (dead) this.dead.set(url, true);
          else this.skip.set(url, true);
        }
      },
    );
    await Promise.all(workers);
    return probed;
  }

  private probe(url: string): Promise<boolean> {
    const running = this.inflight.get(url);
    if (running) return running;
    const task = this.probeOnce(url).finally(() => {
      this.inflight.delete(url);
    });
    this.inflight.set(url, task);
    return task;
  }

  private async probeOnce(url: string): Promise<boolean> {
    try {
      const res = await this.request(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(this.opts.timeoutMs),
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/192.168.1.5 Safari/537.36",
        },
      });
      const raw = await res.text();
      const html = raw.length > maxHtmlBytes ? raw.slice(0, maxHtmlBytes) : raw;
      const dead = htmlLooksExpired(html);
      if (dead && process.env.NODE_ENV !== "production") {
        console.debug(`dead share ${url.slice(0, 64)}`);
      }
      return dead;
    } catch {
      return false;
    }
  }
}
