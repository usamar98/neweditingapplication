import "dotenv/config";

import { z } from "zod";
import {
  falModelOverridesEnvSchema,
  falRoutingProfileSchema,
} from "./providers/fal/routing";

const optionalSecret = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(10).optional(),
);

const workerEnvSchema = z.object({
  CONTENT_ANALYSIS_API_KEY: z.string().optional(),
  CONTENT_ANALYSIS_API_URL: z.string().url().default("https://api.openai.com/v1/chat/completions"),
  CONTENT_ANALYSIS_MODEL: z.string().default("gpt-4.1-mini"),
  CONTENT_ANALYSIS_PROVIDER: z.enum(["auto", "local", "fal", "openai", "openai-compatible"]).default("auto"),
  FAL_KEY: optionalSecret,
  FAL_MODEL_OVERRIDES: falModelOverridesEnvSchema,
  FAL_ROUTING_PROFILE: falRoutingProfileSchema.default("balanced"),
  FFMPEG_PATH: z.string().default("ffmpeg"),
  FFPROBE_PATH: z.string().default("ffprobe"),
  LOG_LEVEL: z.string().default("info"),
  TRANSCRIPTION_API_KEY: z.string().optional(),
  TRANSCRIPTION_API_URL: z.string().url().default("https://api.openai.com/v1/audio/transcriptions"),
  TRANSCRIPTION_MODEL: z.string().default("whisper-1"),
  TRANSCRIPTION_PROVIDER: z.enum(["auto", "local", "fal", "openai", "openai-compatible"]).default("auto"),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(250).max(60000).default(3000),
  WORKER_SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  WORKER_SUPABASE_URL: z.string().url(),
  WORKER_TEMP_MAX_AGE_HOURS: z.coerce.number().positive().max(168).default(24),
  WORKER_TEMP_ROOT: z.string().default("/tmp/scene-forge"),
  WORKER_VISIBILITY_TIMEOUT_SECONDS: z.coerce.number().int().min(60).max(7200).default(1800),
}).superRefine((environment, context) => {
  if (
    (environment.TRANSCRIPTION_PROVIDER === "fal" || environment.CONTENT_ANALYSIS_PROVIDER === "fal")
    && !environment.FAL_KEY
  ) {
    context.addIssue({
      code: "custom",
      message: "FAL_KEY is required when a fal provider is selected explicitly.",
      path: ["FAL_KEY"],
    });
  }
  if (environment.TRANSCRIPTION_PROVIDER === "openai" || environment.TRANSCRIPTION_PROVIDER === "openai-compatible") {
    if (!environment.TRANSCRIPTION_API_KEY) {
      context.addIssue({
        code: "custom",
        message: "TRANSCRIPTION_API_KEY is required for the selected transcription provider.",
        path: ["TRANSCRIPTION_API_KEY"],
      });
    }
  }
  if (environment.CONTENT_ANALYSIS_PROVIDER === "openai" || environment.CONTENT_ANALYSIS_PROVIDER === "openai-compatible") {
    if (!environment.CONTENT_ANALYSIS_API_KEY) {
      context.addIssue({
        code: "custom",
        message: "CONTENT_ANALYSIS_API_KEY is required for the selected analysis provider.",
        path: ["CONTENT_ANALYSIS_API_KEY"],
      });
    }
  }
});

export type WorkerConfig = z.infer<typeof workerEnvSchema>;

let config: WorkerConfig | undefined;

export function getWorkerConfig() {
  config ??= workerEnvSchema.parse(process.env);
  return config;
}
