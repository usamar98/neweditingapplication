import { z } from "zod";
import { generationQueueMessageSchema } from "@/lib/domain/generation";
import { editorAgentIdSchema } from "@/lib/domain/ai-models";
import { videoVisualStyleSchema } from "@/lib/domain/video-styles";

export const VIDEO_SOURCE_BUCKET = "video-sources";
export const VIDEO_OUTPUT_BUCKET = "video-outputs";
export const VIDEO_ASSET_BUCKET = "video-assets";
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_CLIP_SOURCE_SECONDS = 60 * 60;
export const TUS_CHUNK_SIZE = 6 * 1024 * 1024;

export const supportedClipLinkHosts = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "tiktok.com",
  "instagram.com",
  "facebook.com",
  "fb.watch",
  "x.com",
  "twitter.com",
] as const;

function matchesSupportedClipHost(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return supportedClipLinkHosts.some((host) => normalized === host || normalized.endsWith(`.${host}`));
}

export const clipSourceUrlSchema = z.string().trim().url().max(2048).superRefine((value, context) => {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) {
    context.addIssue({ code: "custom", message: "Use a public HTTPS video link without credentials or a custom port." });
  }
  if (!matchesSupportedClipHost(url.hostname)) {
    context.addIssue({
      code: "custom",
      message: "Use a public YouTube, Vimeo, TikTok, Instagram, Facebook, or X video link.",
    });
  }
});

export const importClipProjectSchema = z.object({
  confirmRights: z.literal(true),
  name: z.string().trim().min(1).max(120),
  sourceUrl: clipSourceUrlSchema,
}).strict();

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
    visualStyle: videoVisualStyleSchema.default("natural"),
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
  visualStyle: "natural",
});

export const enqueueJobSchema = z.discriminatedUnion("kind", [
  z.object({
    agentId: editorAgentIdSchema.default("auto"),
    kind: z.literal("analyze"),
  }).strict(),
  z.object({ kind: z.literal("export") }).strict(),
]);

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
