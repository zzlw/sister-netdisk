import { searchEnv } from "./search-env";

function isTimeout(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String(err.name) : "";
  return name === "TimeoutError" || name === "AbortError";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SearchUnavailableError extends Error {
  readonly status = 502;
  constructor(message = "搜索服务暂时不可用") {
    super(message);
    this.name = "SearchUnavailableError";
  }
}

export class SearchTimeoutError extends Error {
  readonly status = 504;
  constructor(message = "搜索超时，请稍后再试") {
    super(message);
    this.name = "SearchTimeoutError";
  }
}

function baseUrl() {
  return searchEnv().PANSOU_URL.replace(/\/$/, "");
}

export async function searchPansou(
  body: Record<string, unknown>,
): Promise<unknown> {
  const attempts = 2;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await searchOnce(body);
    } catch (err) {
      if (attempt === attempts) throw err;
      console.warn(`pansou search retry ${attempt} after wake`);
      await sleep(10_000);
    }
  }
  throw new SearchUnavailableError();
}

async function searchOnce(body: Record<string, unknown>): Promise<unknown> {
  const started = Date.now();
  let status = 0;
  try {
    const res = await fetch(`${baseUrl()}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(searchEnv().PANSOU_TIMEOUT_MS),
    });
    status = res.status;
    if (!res.ok) {
      throw new SearchUnavailableError();
    }
    return await res.json();
  } catch (err) {
    if (err instanceof SearchUnavailableError) throw err;
    if (isTimeout(err)) {
      throw new SearchTimeoutError();
    }
    console.warn(
      `pansou search failed status=${status} ms=${Date.now() - started}`,
    );
    throw new SearchUnavailableError();
  }
}

export async function pansouHealth(timeoutMs = 2000): Promise<"ok" | "down"> {
  try {
    const res = await fetch(`${baseUrl()}/api/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok ? "ok" : "down";
  } catch {
    return "down";
  }
}
