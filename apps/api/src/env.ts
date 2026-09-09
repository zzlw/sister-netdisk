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
});

export const env = envSchema.parse(process.env);
