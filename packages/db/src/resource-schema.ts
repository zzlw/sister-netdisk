import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const resource = pgTable("resource", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  provider: text("provider").notNull(),
  shareUrl: text("share_url").notNull(),
  shareCode: text("share_code").notNull().default(""),
  tags: text("tags").notNull().default(""),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
