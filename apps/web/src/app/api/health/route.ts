import { NextResponse } from "next/server";
import { pansouHealth } from "@/lib/pansou-client";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const wake = new URL(request.url).searchParams.get("wake");
  const waitMs = wake === "1" || wake === "true" ? 25_000 : 2_000;
  return NextResponse.json({
    ok: true,
    service: "web",
    pansou: await pansouHealth(waitMs),
  });
}
