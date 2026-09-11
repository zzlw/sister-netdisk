import { z } from "@repo/shared";

const optionalUrl = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.string().url().optional(),
);

export const webEnv = z
  .object({
    NEXT_PUBLIC_WEB_URL: optionalUrl,
  })
  .parse({
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  });
