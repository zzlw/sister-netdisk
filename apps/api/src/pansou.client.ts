import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { env } from "./env";

function isTimeout(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String(err.name) : "";
  return name === "TimeoutError" || name === "AbortError";
}

@Injectable()
export class PansouClient {
  private readonly logger = new Logger(PansouClient.name);
  private readonly baseUrl = env.PANSOU_URL.replace(/\/$/, "");

  async search(body: Record<string, unknown>): Promise<unknown> {
    const started = Date.now();
    let status = 0;
    try {
      const res = await fetch(`${this.baseUrl}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(env.PANSOU_TIMEOUT_MS),
      });
      status = res.status;
      if (!res.ok) {
        throw new BadGatewayException("搜索服务暂时不可用");
      }
      return await res.json();
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      if (isTimeout(err)) {
        throw new GatewayTimeoutException("搜索超时，请稍后再试");
      }
      this.logger.warn(
        `pansou search failed status=${status} ms=${Date.now() - started}`,
      );
      throw new BadGatewayException("搜索服务暂时不可用");
    }
  }

  async health(): Promise<"ok" | "down"> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok ? "ok" : "down";
    } catch {
      return "down";
    }
  }
}
