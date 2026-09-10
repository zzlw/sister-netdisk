import { Injectable } from "@nestjs/common";
import { env } from "./env";
import { ShareLiveness } from "./share-liveness";

@Injectable()
export class ShareLivenessService extends ShareLiveness {
  constructor() {
    super(
      {
        enabled: env.SHARE_CHECK_ENABLED,
        timeoutMs: env.SHARE_CHECK_TIMEOUT_MS,
        concurrency: env.SHARE_CHECK_CONCURRENCY,
        budgetMs: env.SHARE_CHECK_BUDGET_MS,
        deadTtlMs: env.SHARE_DEAD_TTL_MS,
        skipTtlMs: env.SHARE_SKIP_TTL_MS,
      },
      globalThis.fetch.bind(globalThis),
    );
  }
}
