import {
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from "@nestjs/common";
import { and, db, desc, eq, ilike, or, resource, sql } from "@repo/db";
import type {
  CreateResourceInput,
  DiskProvider,
  ResourceSearchQuery,
  UpdateResourceInput,
} from "@repo/shared";

const demoResources: CreateResourceInput[] = [
  {
    title: "线性代数公开课讲义（示例）",
    description: "演示条目。点击后会跳到对应网盘分享页，本站不存文件。",
    provider: "baidu",
    shareUrl: "https://pan.baidu.com/s/sister-netdisk-demo-math",
    shareCode: "8k2p",
    tags: "教材,数学",
    published: true,
  },
  {
    title: "Python 官方文档离线包（示例）",
    description: "演示条目，用于验证搜索和跳转。",
    provider: "aliyun",
    shareUrl: "https://www.alipan.com/s/sister-netdisk-demo-python",
    shareCode: "",
    tags: "编程,文档",
    published: true,
  },
  {
    title: "Blender 开源场景文件（示例）",
    description: "演示条目。资源在夸克网盘分享页。",
    provider: "quark",
    shareUrl: "https://pan.quark.cn/s/sister-netdisk-demo-blender",
    shareCode: "",
    tags: "设计,开源",
    published: true,
  },
  {
    title: "古典音乐公共领域录音（示例）",
    description: "演示条目，天翼云盘。",
    provider: "tianyi",
    shareUrl: "https://cloud.189.cn/t/sister-netdisk-demo-music",
    shareCode: "a3f1",
    tags: "音乐",
    published: true,
  },
  {
    title: "开源中文字体合集（示例）",
    description: "演示条目，微云。",
    provider: "weiyun",
    shareUrl: "https://share.weiyun.com/sister-netdisk-demo-fonts",
    shareCode: "",
    tags: "字体,设计",
    published: true,
  },
  {
    title: "摄影 RAW 调色预设（示例）",
    description: "演示条目，迅雷云盘。",
    provider: "xunlei",
    shareUrl: "https://pan.xunlei.com/s/sister-netdisk-demo-raw",
    shareCode: "n7qm",
    tags: "摄影",
    published: true,
  },
];

@Injectable()
export class ResourcesService implements OnModuleInit {
  async onModuleInit() {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(resource);
    if (count > 0) {
      return;
    }
    const now = new Date();
    await db.insert(resource).values(
      demoResources.map((item) => ({
        id: crypto.randomUUID(),
        title: item.title,
        description: item.description ?? "",
        provider: item.provider,
        shareUrl: item.shareUrl,
        shareCode: item.shareCode ?? "",
        tags: item.tags ?? "",
        published: item.published ?? true,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  async search(query: ResourceSearchQuery) {
    const page = query.page;
    const pageSize = query.pageSize;
    const filters = [eq(resource.published, true)];
    if (query.q) {
      const like = `%${query.q}%`;
      const textMatch = or(
        ilike(resource.title, like),
        ilike(resource.description, like),
        ilike(resource.tags, like),
      );
      if (textMatch) {
        filters.push(textMatch);
      }
    }
    if (query.provider) {
      filters.push(eq(resource.provider, query.provider));
    }
    const where = and(...filters);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(resource)
      .where(where);
    const items = await db
      .select()
      .from(resource)
      .where(where)
      .orderBy(desc(resource.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    return { items, total: count, page, pageSize };
  }

  listAll() {
    return db.select().from(resource).orderBy(desc(resource.createdAt));
  }

  async create(input: CreateResourceInput) {
    const now = new Date();
    const [row] = await db
      .insert(resource)
      .values({
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description ?? "",
        provider: input.provider,
        shareUrl: input.shareUrl,
        shareCode: input.shareCode ?? "",
        tags: input.tags ?? "",
        published: input.published ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return row;
  }

  async update(id: string, input: UpdateResourceInput) {
    const [row] = await db
      .update(resource)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(resource.id, id))
      .returning();
    if (!row) {
      throw new NotFoundException("资源不存在");
    }
    return row;
  }

  async remove(id: string) {
    const [row] = await db
      .delete(resource)
      .where(eq(resource.id, id))
      .returning({ id: resource.id });
    if (!row) {
      throw new NotFoundException("资源不存在");
    }
    return { ok: true as const };
  }

  providers(): DiskProvider[] {
    return [
      "baidu",
      "aliyun",
      "quark",
      "tianyi",
      "weiyun",
      "xunlei",
      "lanzou",
      "other",
    ];
  }
}
