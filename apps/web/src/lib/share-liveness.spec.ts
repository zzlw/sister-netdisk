import type { Resource } from "@repo/shared";
import {
  collectWindowUrls,
  htmlLooksExpired,
  ShareLiveness,
} from "./share-liveness";

const now = new Date("2026-09-10T04:00:00.000Z");

function card(url: string, id = url): Resource {
  return {
    id,
    title: id,
    description: "",
    provider: "baidu",
    shareUrl: url,
    shareCode: "",
    links: [{ provider: "baidu", shareUrl: url, shareCode: "" }],
    tags: "",
    published: true,
    createdAt: now,
    updatedAt: now,
  };
}

describe("share-liveness", () => {
  it("detects the public expired copy", () => {
    expect(htmlLooksExpired("该分享已失效，不可访问")).toBe(true);
    expect(htmlLooksExpired("<title>啊哦，来晚了</title>")).toBe(true);
    expect(htmlLooksExpired("请输入提取码后查看文件")).toBe(false);
    expect(htmlLooksExpired("网络繁忙，请稍后重试")).toBe(false);
  });

  it("probes the current page window first", () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      card(`https://pan.baidu.com/s/${i}`),
    );
    expect(collectWindowUrls(items, 2, 2)).toEqual([
      "https://pan.baidu.com/s/2",
      "https://pan.baidu.com/s/3",
      "https://pan.baidu.com/s/4",
      "https://pan.baidu.com/s/5",
    ]);
  });

  it("drops pages that say they are expired and keeps timeouts", async () => {
    const request = jest.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("/dead")) {
        return new Response("该分享已失效，不可访问", { status: 200 });
      }
      throw new Error("timeout");
    }) as unknown as typeof fetch;
    const liveness = new ShareLiveness(
      {
        enabled: true,
        timeoutMs: 500,
        concurrency: 2,
        budgetMs: 1000,
        deadTtlMs: 60_000,
        skipTtlMs: 60_000,
      },
      request,
    );
    const swept = await liveness.sweep(
      [
        card("https://pan.baidu.com/s/dead", "dead"),
        card("https://pan.baidu.com/s/slow", "slow"),
      ],
      1,
      12,
    );
    expect(swept.items.map((item) => item.id)).toEqual(["slow"]);
    expect(swept.dropped).toBe(1);
    expect(liveness.isDead("https://pan.baidu.com/s/dead")).toBe(true);
    expect(liveness.isDead("https://pan.baidu.com/s/slow")).toBe(false);
  });
});
