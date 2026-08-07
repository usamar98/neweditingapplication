import "dotenv/config";

import { z } from "zod";

const workerEnvSchema = z.object({
  CONTENT_ANALYSIS_API_KEY: z.string().optional(),
  CONTENT_ANALYSIS_API_URL: z.string().url().default("https://api.openai.com/v1/chat/completions"),
  CONTENT_ANALYSIS_MODEL: z.string().default("gpt-4.1-mini"),
  CONTENT_ANALYSIS_PROVIDER: z.enum(["local", "openai", "openai-compatible"]).default("local"),
  FFMPEG_PATH: z.string().default("ffmpeg"),
  FFPROBE_PATH: z.string().default("ffprobe"),
  LOG_LEVEL: z.string().default("info"),
  TRANSCRIPTION_API_KEY: z.string().optional(),
  TRANSCRIPTION_API_URL: z.string().url().default("https://api.openai.com/v1/audio/transcriptions"),
  TRANSCRIPTION_MODEL: z.string().default("whisper-1"),
  TRANSCRIPTION_PROVIDER: z.enum(["local", "openai", "openai-compatible"]).default("local"),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(250).max(60000).default(3000),
  WORKER_SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  WORKER_SUPABASE_URL: z.string().url(),
  WORKER_TEMP_MAX_AGE_HOURS: z.coerce.number().positive().max(168).default(24),
  WORKER_TEMP_ROOT: z.string().default("/tmp/scene-forge"),
  WORKER_VISIBILITY_TIMEOUT_SECONDS: z.coerce.number().int().min(60).max(7200).default(1800),
});

export type WorkerConfig = z.infer<typeof workerEnvSchema>;

let config: WorkerConfig | undefined;

export function getWorkerConfig() {
  config ??= workerEnvSchema.parse(process.env);
  return config;
}
