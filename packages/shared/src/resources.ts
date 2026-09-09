import { z } from "zod";
import { diskProviderSchema } from "./providers.js";

const shareUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
    message: "只要 http(s) 链接",
  });

export const resourceSearchQuerySchema = z.object({
  q: z.string().trim().max(80).optional().default(""),
  provider: diskProviderSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type ResourceSearchQuery = z.infer<typeof resourceSearchQuerySchema>;

export const createResourceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().default(""),
  provider: diskProviderSchema,
  shareUrl: shareUrlSchema,
  shareCode: z.string().trim().max(32).optional().default(""),
  tags: z.string().trim().max(120).optional().default(""),
  published: z.boolean().optional().default(true),
});
export type CreateResourceInput = z.infer<typeof createResourceSchema>;

export const updateResourceSchema = createResourceSchema.partial();
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

export const resourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  provider: diskProviderSchema,
  shareUrl: z.string(),
  shareCode: z.string(),
  tags: z.string(),
  published: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Resource = z.infer<typeof resourceSchema>;

export const resourceSearchResponseSchema = z.object({
  items: z.array(resourceSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type ResourceSearchResponse = z.infer<
  typeof resourceSearchResponseSchema
>;
