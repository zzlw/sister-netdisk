import { z } from "@repo/shared";

const searchEnvSchema = z.object({
  PANSOU_URL: z.string().url(),
  PANSOU_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60_000)
    .default(30_000),
  PANSOU_CHANNELS: z.string().optional().default(""),
  PANSOU_PLUGINS: z.string().optional().default(""),
  PANSOU_CACHE_TTL_MS: z.coerce
    .number()
    .int()
    .min(0)
    .max(600_000)
    .default(60_000),
  SHARE_CHECK_ENABLED: z
    .string()
    .optional()
    .default("false")
    .transform((value) => value !== "0" && value.toLowerCase() !== "false"),
  SHARE_CHECK_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(500)
    .max(8_000)
    .default(2_000),
  SHARE_CHECK_CONCURRENCY: z.coerce.number().int().min(1).max(12).default(6),
  SHARE_CHECK_BUDGET_MS: z.coerce
    .number()
    .int()
    .min(0)
    .max(8_000)
    .default(2_500),
  SHARE_DEAD_TTL_MS: z.coerce
    .number()
    .int()
    .min(60_000)
    .max(30 * 24 * 60 * 60 * 1000)
    .default(7 * 24 * 60 * 60 * 1000),
  SHARE_SKIP_TTL_MS: z.coerce
    .number()
    .int()
    .min(10_000)
    .max(24 * 60 * 60 * 1000)
    .default(30 * 60 * 1000),
});

export type SearchEnv = z.infer<typeof searchEnvSchema>;

let cached: SearchEnv | undefined;

export function searchEnv(): SearchEnv {
  cached ??= searchEnvSchema.parse(process.env);
  return cached;
}
