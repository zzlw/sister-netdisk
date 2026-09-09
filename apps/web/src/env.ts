import { z } from "@repo/shared";

const optionalUrl = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.string().url().optional(),
);

export const webEnv = z
  .object({
    API_INTERNAL_URL: optionalUrl,
    NEXT_PUBLIC_WEB_URL: optionalUrl,
  })
  .parse({
    API_INTERNAL_URL: process.env.API_INTERNAL_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  });
