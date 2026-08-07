import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  LOG_LEVEL: z.string().default("info"),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(3600),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    LOG_LEVEL: process.env.LOG_LEVEL,
    SIGNED_URL_TTL_SECONDS: process.env.SIGNED_URL_TTL_SECONDS,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

export function getSignedUrlTtl() {
  return z.coerce
    .number()
    .int()
    .min(60)
    .max(86400)
    .catch(3600)
    .parse(process.env.SIGNED_URL_TTL_SECONDS);
}
