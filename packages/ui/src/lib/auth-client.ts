import { createAuthClient } from "better-auth/react";

/** 同源 /api/auth，经 Next rewrite 到 Nest，Cookie 落在当前端口。 */
export const authClient = createAuthClient();
