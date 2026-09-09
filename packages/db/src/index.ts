import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export { and, desc, eq, ilike, or, sql };

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(url);
export const db = drizzle({ client, schema });
export * from "./schema.js";
export { schema };

export async function promoteFirstUserToAdmin(id: string) {
  const rows = await db.select({ id: schema.user.id }).from(schema.user);
  if (rows.length === 1) {
    await db
      .update(schema.user)
      .set({ role: "admin" })
      .where(eq(schema.user.id, id));
  }
}
