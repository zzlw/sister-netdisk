import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  type OnModuleInit,
} from "@nestjs/common";
import { env } from "./env";

function isTimeout(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String(err.name) : "";
  return name === "TimeoutError" || name === "AbortError";
}

@Injectable()
export class PansouClient implements OnModuleInit {
  private readonly logger = new Logger(PansouClient.name);
  private readonly baseUrl = env.PANSOU_URL.replace(/\/$/, "");

  onModuleInit() {
    void this.warm();
  }

  /** Render 免费档睡醒要十几秒；启动时先戳一下，别等用户搜才冷启动。 */
  async warm(): Promise<void> {
    const ok = (await this.health(25_000)) === "ok";
    this.logger.log(`pansou warm ${ok ? "ok" : "down"}`);
  }

  async search(body: Record<string, unknown>): Promise<unknown> {
    try {
      return await this.searchOnce(body);
    } catch {
      this.logger.warn("pansou search retry after wake");
      return await this.searchOnce(body);
    }
  }

  private async searchOnce(body: Record<string, unknown>): Promise<unknown> {
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

  async health(timeoutMs = 2000): Promise<"ok" | "down"> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      return res.ok ? "ok" : "down";
    } catch {
      return "down";
    }
  }
}
