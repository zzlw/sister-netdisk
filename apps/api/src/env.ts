import { z } from "zod";

/** Nest 启动时校验，未通过则进程退出。 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  CORS_ORIGINS: z.string().min(1),
  WEB_URL: z.string().url().optional(),
  ADMIN_URL: z.string().url().optional(),
  NEXT_PUBLIC_WEB_URL: z.string().url().optional(),
  NEXT_PUBLIC_ADMIN_URL: z.string().url().optional(),
  API_PORT: z.coerce.number().int().optional(),
  PORT: z.coerce.number().int().optional(),
  SWAGGER: z.string().optional(),
  NODE_ENV: z.string().optional(),
  PANSOU_URL: z.string().url(),
  PANSOU_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(30_000)
    .default(10_000),
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
    .default("true")
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

export const env = envSchema.parse(process.env);
