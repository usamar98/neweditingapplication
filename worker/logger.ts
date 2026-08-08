import pino from "pino";
import { getWorkerConfig } from "./config";

export const workerLogger = pino({
  base: { service: "scene-forge-worker" },
  level: getWorkerConfig().LOG_LEVEL,
  redact: {
    paths: [
      "authorization",
      "access_token",
      "refresh_token",
      "WORKER_SUPABASE_SERVICE_ROLE_KEY",
      "TRANSCRIPTION_API_KEY",
      "CONTENT_ANALYSIS_API_KEY",
      "FAL_KEY",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
