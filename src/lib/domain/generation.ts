import { z } from "zod";
import {
  backgroundAgentIdSchema,
  imageAgentIdSchema,
  performanceCreativeAgentIdSchema,
  videoDurations,
  videoAgentIdSchema,
  videoAgentSupports,
  videoResolutions,
} from "@/lib/domain/ai-models";

export const generationKinds = ["image", "video", "background_removal", "performance_creative"] as const;
export const generationKindSchema = z.enum(generationKinds);
export type GenerationKind = z.infer<typeof generationKindSchema>;

export const routingProfiles = ["quality", "balanced", "speed", "cost"] as const;
export const generationRoutingProfileSchema = z.enum(routingProfiles);
export type GenerationRoutingProfile = z.infer<typeof generationRoutingProfileSchema>;

export const imageAspectRatios = [
  "square_hd",
  "portrait_4_3",
  "portrait_16_9",
  "landscape_4_3",
  "landscape_16_9",
] as const;

export const imageStyles = [
  "auto",
  "photoreal",
  "cinematic",
  "editorial",
  "product",
  "illustration",
] as const;

export const videoCameraMotions = [
  "auto",
  "static",
  "dolly-in",
  "orbit",
  "handheld",
  "drone",
] as const;

export const videoMoods = [
  "auto",
  "cinematic",
  "energetic",
  "dreamy",
  "documentary",
  "luxury",
] as const;

export const performanceCreativePlatforms = ["facebook", "instagram", "tiktok", "youtube"] as const;
export const performanceCreativePlatformSchema = z.enum(performanceCreativePlatforms);
export type PerformanceCreativePlatform = z.infer<typeof performanceCreativePlatformSchema>;

export const performanceCreativePlatformPresets: Record<PerformanceCreativePlatform, {
  aspectRatio: "16:9" | "9:16";
  label: string;
  placement: string;
}> = {
  facebook: { aspectRatio: "9:16", label: "Facebook", placement: "Feed + Reels" },
  instagram: { aspectRatio: "9:16", label: "Instagram", placement: "Reels + Stories" },
  tiktok: { aspectRatio: "9:16", label: "TikTok", placement: "In-feed video" },
  youtube: { aspectRatio: "9:16", label: "YouTube", placement: "Shorts" },
};

const sharedRequestShape = {
  name: z.string().trim().min(1).max(120),
  profile: generationRoutingProfileSchema.default("balanced"),
  prompt: z.string().trim().min(3).max(4000),
};

export const imageGenerationRequestSchema = z
  .object({
    ...sharedRequestShape,
    agentId: imageAgentIdSchema.default("auto"),
    aspectRatio: z.enum(imageAspectRatios).default("landscape_16_9"),
    kind: z.literal("image"),
    seed: z.number().int().min(0).max(2147483647).optional(),
    style: z.enum(imageStyles).default("auto"),
  })
  .strict();

export const videoGenerationRequestSchema = z
  .object({
    ...sharedRequestShape,
    agentId: videoAgentIdSchema.default("auto"),
    aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
    cameraMotion: z.enum(videoCameraMotions).default("auto"),
    duration: z.enum(videoDurations).default("8s"),
    generateAudio: z.boolean().default(true),
    kind: z.literal("video"),
    mood: z.enum(videoMoods).default("cinematic"),
    resolution: z.enum(videoResolutions).default("1080p"),
    seed: z.number().int().min(0).max(2147483647).optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.agentId !== "auto" && !videoAgentSupports(input.agentId, input.duration, input.resolution)) {
      context.addIssue({
        code: "custom",
        message: "The selected model does not support this duration and resolution combination.",
        path: ["agentId"],
      });
    }
  });

export const backgroundRemovalRequestSchema = z
  .object({
    agentId: backgroundAgentIdSchema.default("auto"),
    kind: z.literal("background_removal"),
    name: z.string().trim().min(1).max(120),
    profile: generationRoutingProfileSchema.default("quality"),
    prompt: z.string().trim().min(3).max(4000).default("Remove the image background with a clean transparent edge."),
    sourceBucket: z.literal("background-inputs"),
    sourceMime: z.enum(["image/jpeg", "image/png", "image/webp"]),
    sourcePath: z.string().trim().min(1).max(1024),
  })
  .strict();

export const performanceCreativeSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("product_url"),
    url: z.string().trim().max(2048).url().refine(
      (value) => new URL(value).protocol === "https:",
      "Product URL must use HTTPS.",
    ),
  }).strict(),
  z.object({
    projectId: z.string().uuid(),
    type: z.literal("long_video"),
  }).strict(),
]);

export const performanceCreativeRequestSchema = z
  .object({
    agentId: performanceCreativeAgentIdSchema.default("auto"),
    audience: z.string().trim().min(2).max(500),
    callToAction: z.string().trim().min(2).max(120),
    duration: z.enum(["8s", "15s", "30s"]).default("15s"),
    kind: z.literal("performance_creative"),
    name: z.string().trim().min(1).max(120),
    platform: performanceCreativePlatformSchema,
    profile: generationRoutingProfileSchema.default("balanced"),
    prompt: z.string().trim().min(3).max(4000),
    source: performanceCreativeSourceSchema,
  })
  .strict();

export const generationRequestSchema = z.discriminatedUnion("kind", [
  imageGenerationRequestSchema,
  videoGenerationRequestSchema,
  backgroundRemovalRequestSchema,
  performanceCreativeRequestSchema,
]);

export const generationJobPayloadSchema = z.discriminatedUnion("kind", [
  imageGenerationRequestSchema.extend({ requestId: z.string().uuid() }),
  videoGenerationRequestSchema.extend({ requestId: z.string().uuid() }),
  backgroundRemovalRequestSchema.extend({ requestId: z.string().uuid() }),
  performanceCreativeRequestSchema.extend({ requestId: z.string().uuid() }),
]);

export const generationQueueMessageSchema = z.union([
  z.object({
    generationId: z.string().uuid(),
    jobId: z.string().uuid(),
    kind: z.literal("generate_image"),
    userId: z.string().uuid(),
  }).strict(),
  z.object({
    generationId: z.string().uuid(),
    jobId: z.string().uuid(),
    kind: z.literal("generate_video"),
    userId: z.string().uuid(),
  }).strict(),
  z.object({
    generationId: z.string().uuid(),
    jobId: z.string().uuid(),
    kind: z.literal("generate_background_removal"),
    userId: z.string().uuid(),
  }).strict(),
  z.object({
    generationId: z.string().uuid(),
    jobId: z.string().uuid(),
    kind: z.literal("generate_performance_creative"),
    userId: z.string().uuid(),
  }).strict(),
]);

export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type GenerationJobPayload = z.infer<typeof generationJobPayloadSchema>;
export type GenerationQueueMessage = z.infer<typeof generationQueueMessageSchema>;

const imageStyleDirection: Record<(typeof imageStyles)[number], string> = {
  auto: "",
  cinematic: "Cinematic art direction, dramatic composition, intentional depth, premium color grade.",
  editorial: "High-end editorial art direction, confident composition, polished magazine finish.",
  illustration: "Sophisticated authored illustration, rich detail, deliberate shapes and texture.",
  photoreal: "Photorealistic materials, natural light behavior, physically plausible detail, premium photography.",
  product: "Luxury product campaign, controlled studio lighting, precise materials, clean commercial composition.",
};

const cameraDirection: Record<(typeof videoCameraMotions)[number], string> = {
  auto: "",
  "dolly-in": "Use a smooth, deliberate dolly-in camera move.",
  drone: "Use an elegant aerial drone movement with strong parallax.",
  handheld: "Use controlled cinematic handheld movement with natural micro-motion.",
  orbit: "Orbit smoothly around the primary subject while preserving subject consistency.",
  static: "Use a locked-off camera with purposeful movement inside the frame.",
};

const moodDirection: Record<(typeof videoMoods)[number], string> = {
  auto: "",
  cinematic: "Cinematic lighting, coherent production design, premium color grade.",
  documentary: "Authentic documentary texture, believable natural light, observational detail.",
  dreamy: "Dreamlike atmosphere, soft transitions, luminous color, elegant motion.",
  energetic: "High-energy pacing, bold motion, vivid contrast, immediate visual hook.",
  luxury: "Understated luxury, precise materials, refined lighting, restrained premium composition.",
};

export function buildGenerationPrompt(input: GenerationRequest) {
  if (input.kind === "background_removal") {
    return input.prompt;
  }
  if (input.kind === "performance_creative") {
    const preset = performanceCreativePlatformPresets[input.platform];
    return [
      input.prompt,
      `Target audience: ${input.audience}.`,
      `Call to action: ${input.callToAction}.`,
      `Deliver for ${preset.label} ${preset.placement} in ${preset.aspectRatio}.`,
      "Open with an immediate product or story hook, keep one clear message, preserve brand credibility, and finish with a legible conversion moment.",
      "Do not invent discounts, reviews, guarantees, ingredients, or performance claims not present in the source brief.",
    ].join("\n");
  }
  if (input.kind === "image") {
    return [input.prompt, imageStyleDirection[input.style], "No watermark, no UI chrome, no accidental text unless explicitly requested."]
      .filter(Boolean)
      .join("\n");
  }

  return [
    input.prompt,
    cameraDirection[input.cameraMotion],
    moodDirection[input.mood],
    input.generateAudio
      ? "Create synchronized production-ready audio that supports the scene; keep dialogue intelligible when present."
      : "Do not generate dialogue or soundtrack; focus entirely on visual storytelling.",
    "Maintain temporal consistency, stable subjects, natural motion, and a clear visual payoff.",
  ]
    .filter(Boolean)
    .join("\n");
}
