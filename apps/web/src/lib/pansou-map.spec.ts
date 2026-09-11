import {
  cloudTypesForProvider,
  dropDeadLinks,
  foldByTitle,
  mapPansouToResources,
  mapUpstreamProvider,
  paginateResources,
  resourceIdFromTitle,
  resourceIdFromUrl,
  sortResources,
} from "./pansou-map";

describe("pansou-map", () => {
  const now = new Date("2026-09-10T03:00:00.000Z");

  it("maps merged links, keeps 115, and drops magnet / ed2k", () => {
    const items = mapPansouToResources(
      {
        merged_by_type: {
          baidu: [
            {
              url: "https://pan.baidu.com/s/1abcdef",
              password: "1234",
              note: "线性代数讲义",
              datetime: "2023-06-10T14:23:45Z",
              source: "tg:tgsearchers7",
            },
          ],
          "115": [
            {
              url: "https://115.com/s/xyz",
              password: "",
              note: "115 合集",
              source: "plugin:aipan",
            },
          ],
          magnet: [
            {
              url: "magnet:?xt=urn:btih:deadbeef",
              note: "should drop",
            },
          ],
          ed2k: [
            {
              url: "ed2k://|file|x|/",
              note: "should drop",
            },
          ],
        },
      },
      now,
    );

    expect(items).toHaveLength(2);
    const baidu = items.find((item) => item.provider === "baidu");
    const pan115 = items.find((item) => item.provider === "115");
    expect(baidu).toMatchObject({
      id: resourceIdFromTitle("线性代数讲义"),
      title: "线性代数讲义",
      shareCode: "1234",
      tags: "tgsearchers7",
      published: true,
    });
    expect(pan115).toMatchObject({
      provider: "115",
      tags: "aipan",
    });
    expect(
      items.every((item) =>
        item.links.every((link) => !link.shareUrl.startsWith("magnet:")),
      ),
    ).toBe(true);
  });

  it("dedupes the same URL and folds the same title across disks", () => {
    const items = mapPansouToResources(
      {
        merged_by_type: {
          baidu: [
            {
              url: "https://PAN.baidu.com/s/same/",
              password: "1",
              note: "  线性代数讲义  ",
            },
            {
              url: "https://pan.baidu.com/s/same",
              password: "1",
              note: "线性代数讲义",
            },
          ],
          quark: [
            {
              url: "https://pan.quark.cn/s/other",
              password: "",
              note: "线性代数讲义",
            },
          ],
        },
      },
      now,
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(resourceIdFromTitle("线性代数讲义"));
    expect(items[0]?.links.map((link) => link.provider)).toEqual([
      "baidu",
      "quark",
    ]);
  });

  it("keeps one link per provider when folding a title", () => {
    const items = mapPansouToResources(
      {
        merged_by_type: {
          quark: [
            { url: "https://pan.quark.cn/s/a", note: "同一课" },
            { url: "https://pan.quark.cn/s/b", note: "同一课" },
          ],
          baidu: [{ url: "https://pan.baidu.com/s/c", note: "同一课" }],
        },
      },
      now,
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.links.map((link) => link.provider)).toEqual([
      "quark",
      "baidu",
    ]);
  });

  it("collapses duplicate providers on the same title", () => {
    const items = mapPansouToResources(
      {
        merged_by_type: {
          "115": [
            { url: "https://115.com/s/a", password: "x42", note: "PS教程" },
            { url: "https://115.com/s/b", password: "x42", note: "PS教程" },
            { url: "https://115.com/s/c", password: "x42", note: "PS教程" },
          ],
        },
      },
      now,
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.links).toHaveLength(1);
    expect(items[0]?.provider).toBe("115");
  });

  it("falls back to results when merge is empty", () => {
    const items = mapPansouToResources(
      {
        data: {
          results: [
            {
              title: "Python 文档",
              content: "离线包说明很长".repeat(80),
              channel: "yunpanx",
              datetime: "not-a-date",
              links: [
                {
                  type: "aliyun",
                  url: "https://www.alipan.com/s/abc",
                  password: "",
                },
                { type: "magnet", url: "magnet:?xt=urn:btih:ff" },
              ],
            },
          ],
        },
      },
      now,
    );
    expect(items).toHaveLength(1);
    expect(items[0].provider).toBe("aliyun");
    expect(items[0].description.length).toBe(500);
    expect(items[0].createdAt).toEqual(new Date(0));
  });

  it("filters a folded card down to the requested provider", () => {
    const items = mapPansouToResources(
      {
        merged_by_type: {
          quark: [
            { url: "https://pan.quark.cn/s/a", note: "同一课" },
            { url: "https://pan.quark.cn/s/b", note: "夸克2" },
          ],
          uc: [{ url: "https://drive.uc.cn/s/c", note: "同一课" }],
        },
      },
      now,
    );
    expect(items).toHaveLength(2);
    const page = paginateResources(items, {
      provider: "uc",
      page: 1,
      pageSize: 12,
    });
    expect(page.total).toBe(1);
    expect(page.items[0]?.provider).toBe("uc");
    expect(page.items[0]?.links).toHaveLength(1);
  });

  it("does not send cloud_types for other", () => {
    expect(cloudTypesForProvider("baidu")).toEqual(["baidu"]);
    expect(cloudTypesForProvider("115")).toEqual(["115"]);
    expect(cloudTypesForProvider("other")).toBeUndefined();
    expect(mapUpstreamProvider("magnet")).toBeNull();
    expect(mapUpstreamProvider("115")).toEqual({
      provider: "115",
      original: null,
    });
    expect(mapUpstreamProvider("lanzou")).toEqual({
      provider: "lanzou",
      original: null,
    });
  });

  it("does not fold anonymous titles", () => {
    const folded = foldByTitle([
      {
        id: resourceIdFromUrl("https://pan.baidu.com/s/a"),
        title: "网盘分享",
        description: "",
        provider: "baidu",
        shareUrl: "https://pan.baidu.com/s/a",
        shareCode: "",
        links: [
          {
            provider: "baidu",
            shareUrl: "https://pan.baidu.com/s/a",
            shareCode: "",
          },
        ],
        tags: "",
        published: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: resourceIdFromUrl("https://pan.quark.cn/s/b"),
        title: "网盘分享",
        description: "",
        provider: "quark",
        shareUrl: "https://pan.quark.cn/s/b",
        shareCode: "",
        links: [
          {
            provider: "quark",
            shareUrl: "https://pan.quark.cn/s/b",
            shareCode: "",
          },
        ],
        tags: "",
        published: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    expect(folded).toHaveLength(2);
  });

  it("drops expired links and cards with no live link", () => {
    const dead = "https://pan.baidu.com/s/dead";
    const live = "https://pan.quark.cn/s/live";
    const items = dropDeadLinks(
      [
        {
          id: "a",
          title: "课",
          description: "",
          provider: "baidu",
          shareUrl: dead,
          shareCode: "",
          links: [
            { provider: "baidu", shareUrl: dead, shareCode: "" },
            { provider: "quark", shareUrl: live, shareCode: "" },
          ],
          tags: "",
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "b",
          title: "废",
          description: "",
          provider: "baidu",
          shareUrl: dead,
          shareCode: "",
          links: [{ provider: "baidu", shareUrl: dead, shareCode: "" }],
          tags: "",
          published: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
      (url) => url === dead,
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.provider).toBe("quark");
    expect(items[0]?.links).toHaveLength(1);
  });

  it("keeps relevance order and sorts by createdAt", () => {
    const older = new Date("2024-01-01T00:00:00.000Z");
    const newer = new Date("2026-09-01T00:00:00.000Z");
    const items = [
      {
        id: "old",
        title: "旧",
        description: "",
        provider: "baidu" as const,
        shareUrl: "https://pan.baidu.com/s/old",
        shareCode: "",
        links: [
          {
            provider: "baidu" as const,
            shareUrl: "https://pan.baidu.com/s/old",
            shareCode: "",
          },
        ],
        tags: "",
        published: true,
        createdAt: older,
        updatedAt: older,
      },
      {
        id: "new",
        title: "新",
        description: "",
        provider: "quark" as const,
        shareUrl: "https://pan.quark.cn/s/new",
        shareCode: "",
        links: [
          {
            provider: "quark" as const,
            shareUrl: "https://pan.quark.cn/s/new",
            shareCode: "",
          },
        ],
        tags: "",
        published: true,
        createdAt: newer,
        updatedAt: newer,
      },
    ];
    expect(sortResources(items, "relevance").map((item) => item.id)).toEqual([
      "old",
      "new",
    ]);
    expect(sortResources(items, "newest").map((item) => item.id)).toEqual([
      "new",
      "old",
    ]);
    expect(sortResources(items, "oldest").map((item) => item.id)).toEqual([
      "old",
      "new",
    ]);
    const page = paginateResources(items, {
      page: 1,
      pageSize: 1,
      sort: "newest",
    });
    expect(page.total).toBe(2);
    expect(page.items[0]?.id).toBe("new");

    const unknown = {
      ...items[0],
      id: "unk",
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
    const withUnknown = [unknown, ...items];
    expect(sortResources(withUnknown, "newest").map((item) => item.id)).toEqual(
      ["new", "old", "unk"],
    );
    expect(sortResources(withUnknown, "oldest").map((item) => item.id)).toEqual(
      ["old", "new", "unk"],
    );
  });
});
