import { resourceSearchQuerySchema } from "@repo/shared";
import { NextResponse } from "next/server";
import {
  SearchTimeoutError,
  SearchUnavailableError,
} from "@/lib/pansou-client";
import { searchResources } from "@/lib/resources-search";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = resourceSearchQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    provider: url.searchParams.get("provider") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }

  try {
    return NextResponse.json(await searchResources(parsed.data));
  } catch (err) {
    if (err instanceof SearchTimeoutError) {
      return NextResponse.json({ error: err.message }, { status: 504 });
    }
    const message =
      err instanceof SearchUnavailableError
        ? err.message
        : "搜索服务暂时不可用";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
