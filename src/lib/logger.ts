import "server-only";

import pino from "pino";

export const logger = pino({
  base: { service: "scene-forge-web" },
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "authorization",
      "access_token",
      "refresh_token",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
