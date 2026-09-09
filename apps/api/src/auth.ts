import { db, schema } from "@repo/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { env } from "./env";

const trustedOrigins = env.CORS_ORIGINS.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const webOrigins = [env.WEB_URL, env.NEXT_PUBLIC_WEB_URL]
  .filter((s): s is string => Boolean(s))
  .map((s) => s.replace(/\/$/, ""));
const adminOrigins = [env.ADMIN_URL, env.NEXT_PUBLIC_ADMIN_URL]
  .filter((s): s is string => Boolean(s))
  .map((s) => s.replace(/\/$/, ""));

function requestOrigin(headers?: Headers) {
  return (headers?.get("origin") ?? "").replace(/\/$/, "");
}

function isWebOrigin(origin: string) {
  return webOrigins.some((u) => u === origin);
}

function isAdminOrigin(origin: string) {
  return adminOrigins.some((u) => u === origin);
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      if (isAdminOrigin(requestOrigin(ctx.headers))) {
        throw new APIError("FORBIDDEN", { message: "后台不开放注册" });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const created = ctx.context.newSession;
      if (!created) return;
      const role = (created.user as { role?: string }).role;
      const origin = requestOrigin(ctx.headers);
      const reject =
        (isAdminOrigin(origin) && role !== "admin") ||
        (isWebOrigin(origin) && role === "admin");
      if (!reject) return;
      await ctx.context.internalAdapter.deleteSession(created.session.token);
      throw new APIError("FORBIDDEN", {
        message: isAdminOrigin(origin)
          ? "请使用员工账号登录后台"
          : "请使用会员账号登录官网",
      });
    }),
  },
});
