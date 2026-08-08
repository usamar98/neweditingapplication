import { z } from "zod";
import { generationQueueMessageSchema } from "@/lib/domain/generation";

export const VIDEO_SOURCE_BUCKET = "video-sources";
export const VIDEO_OUTPUT_BUCKET = "video-outputs";
export const VIDEO_ASSET_BUCKET = "video-assets";
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
export const TUS_CHUNK_SIZE = 6 * 1024 * 1024;

export const supportedVideoMimeTypes = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
] as const;

export const createProjectSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.enum(supportedVideoMimeTypes),
    name: z.string().trim().min(1).max(120),
    resumeProjectId: z.string().uuid().optional(),
    size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  })
  .strict();

export const captionSettingsSchema = z
  .object({
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    backgroundOpacity: z.number().min(0).max(1),
    enabled: z.boolean(),
    font: z.enum(["Inter", "Arial", "Montserrat", "Roboto"]),
    fontSize: z.number().int().min(18).max(96),
    position: z.enum(["top", "middle", "bottom"]),
    textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  })
  .strict();

export const editSettingsSchema = z
  .object({
    aspectRatio: z.enum([
      "original",
      "tiktok",
      "instagram-reel",
      "instagram-square",
      "youtube",
    ]),
    audio: z
      .object({
        muted: z.boolean(),
        noiseReduction: z.boolean(),
        volume: z.number().min(0).max(2),
      })
      .strict(),
    captions: captionSettingsSchema,
    removeFillers: z.boolean(),
    removeSilences: z.boolean(),
    trimEnd: z.number().positive().nullable(),
    trimStart: z.number().min(0),
  })
  .strict()
  .superRefine((settings, context) => {
    if (settings.trimEnd !== null && settings.trimEnd <= settings.trimStart) {
      context.addIssue({
        code: "custom",
        message: "Trim end must be after trim start.",
        path: ["trimEnd"],
      });
    }
  });

export const defaultEditSettings = editSettingsSchema.parse({
  aspectRatio: "original",
  audio: { muted: false, noiseReduction: false, volume: 1 },
  captions: {
    backgroundColor: "#000000",
    backgroundOpacity: 0.72,
    enabled: true,
    font: "Inter",
    fontSize: 42,
    position: "bottom",
    textColor: "#FFFFFF",
  },
  removeFillers: false,
  removeSilences: false,
  trimEnd: null,
  trimStart: 0,
});

export const enqueueJobSchema = z
  .object({
    kind: z.enum(["analyze", "export"]),
  })
  .strict();

export const projectQueueMessageSchema = z
  .object({
    jobId: z.string().uuid(),
    kind: z.enum(["analyze", "export"]),
    projectId: z.string().uuid(),
    userId: z.string().uuid(),
  })
  .strict();

export const queueMessageSchema = z.union([
  projectQueueMessageSchema,
  generationQueueMessageSchema,
]);

export type EditSettings = z.infer<typeof editSettingsSchema>;
export type QueueMessage = z.infer<typeof queueMessageSchema>;

export type TranscriptWord = {
  end: number;
  start: number;
  text: string;
};

export type TranscriptSegment = {
  end: number;
  id: number;
  start: number;
  text: string;
  words: TranscriptWord[];
};

export type Transcript = {
  language: string | null;
  segments: TranscriptSegment[];
  text: string;
};

export type TimeRange = {
  end: number;
  score?: number;
  start: number;
};

export type FillerSuggestion = TimeRange & {
  text: string;
};

export type VideoAnalysis = {
  fillers: FillerSuggestion[];
  highlights: (TimeRange & { reason: string })[];
  scenes: (TimeRange & { score: number })[];
  silences: TimeRange[];
};

export const emptyTranscript: Transcript = {
  language: null,
  segments: [],
  text: "",
};

export const emptyAnalysis: VideoAnalysis = {
  fillers: [],
  highlights: [],
  scenes: [],
  silences: [],
};
