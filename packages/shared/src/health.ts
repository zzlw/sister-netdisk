import { z } from "zod";

export const healthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.string(),
  pansou: z.enum(["ok", "down"]).optional(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
