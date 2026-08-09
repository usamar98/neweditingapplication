import { z } from "zod";

export const falCapabilities = [
  "transcription",
  "content-analysis",
  "text-to-image",
  "text-to-video",
  "image-to-video",
  "voiceover",
  "caption-removal",
  "background-removal",
  "video-understanding",
] as const;

export const falCapabilitySchema = z.enum(falCapabilities);
export type FalCapability = z.infer<typeof falCapabilitySchema>;

export const falRoutingProfileSchema = z.enum(["quality", "balanced", "speed", "cost"]);
export type FalRoutingProfile = z.infer<typeof falRoutingProfileSchema>;

const endpointIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(200)
  .regex(/^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)+$/i, "Invalid fal endpoint ID");

const modelOverrideSchema = z.union([
  endpointIdSchema,
  z.object({
    endpointId: endpointIdSchema,
    model: z.string().trim().min(1).max(200).optional(),
  }),
]);

const modelOverridesSchema = z.partialRecord(falCapabilitySchema, modelOverrideSchema);

export const falModelOverridesEnvSchema = z
  .string()
  .default("{}")
  .transform((raw, context) => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      context.addIssue({ code: "custom", message: "FAL_MODEL_OVERRIDES must be valid JSON." });
      return z.NEVER;
    }
  })
  .pipe(modelOverridesSchema);

export type FalModelOverrides = z.infer<typeof modelOverridesSchema>;

type FalModelCandidate = {
  endpointId: string;
  id: string;
  model?: string;
  scores: {
    cost: number;
    quality: number;
    reliability: number;
    speed: number;
  };
  summary: string;
};

const candidate = (
  value: Omit<FalModelCandidate, "id"> & { id?: string },
): FalModelCandidate => ({ ...value, id: value.id ?? `${value.endpointId}:${value.model ?? "default"}` });

/**
 * Curated, schema-compatible fal endpoints. Scores are relative (1-10), not
 * pricing claims. Environment overrides let operations change an endpoint
 * immediately while this compatibility catalog is reviewed in code.
 */
export const falModelCatalog: Record<FalCapability, readonly FalModelCandidate[]> = {
  "transcription": [
    candidate({
      endpointId: "fal-ai/whisper",
      scores: { cost: 8, quality: 9, reliability: 9, speed: 8 },
      summary: "Timestamped speech transcription with word-level chunks.",
    }),
  ],
  "content-analysis": [
    candidate({
      endpointId: "openrouter/router",
      model: "openai/gpt-5-mini",
      scores: { cost: 6, quality: 10, reliability: 9, speed: 7 },
      summary: "Higher-quality structured transcript analysis.",
    }),
    candidate({
      endpointId: "openrouter/router",
      model: "google/gemini-2.5-flash",
      scores: { cost: 8, quality: 8, reliability: 9, speed: 9 },
      summary: "Balanced structured transcript analysis.",
    }),
    candidate({
      endpointId: "openrouter/router",
      model: "google/gemini-2.5-flash-lite",
      scores: { cost: 10, quality: 6, reliability: 9, speed: 10 },
      summary: "Fast, economical structured transcript analysis.",
    }),
  ],
  "text-to-image": [
    candidate({
      endpointId: "bytedance/seedream/v5/pro/text-to-image",
      scores: { cost: 5, quality: 10, reliability: 8, speed: 6 },
      summary: "Premium Seedream 5 image generation with strong prompt and layout understanding.",
    }),
    candidate({
      endpointId: "fal-ai/recraft/v4.1/pro/text-to-image",
      scores: { cost: 5, quality: 10, reliability: 9, speed: 6 },
      summary: "High-resolution Recraft generation for brand and commercial design.",
    }),
    candidate({
      endpointId: "fal-ai/nano-banana-2",
      scores: { cost: 6, quality: 9, reliability: 9, speed: 8 },
      summary: "High prompt fidelity for directed production visuals.",
    }),
    candidate({
      endpointId: "fal-ai/flux-2-max",
      scores: { cost: 4, quality: 10, reliability: 9, speed: 5 },
      summary: "Maximum-quality FLUX.2 image generation.",
    }),
    candidate({
      endpointId: "bytedance/seedream/v5/lite/text-to-image",
      scores: { cost: 9, quality: 8, reliability: 8, speed: 9 },
      summary: "Fast high-resolution Seedream generation for economical iteration.",
    }),
    candidate({
      endpointId: "fal-ai/flux-2/turbo",
      scores: { cost: 9, quality: 8, reliability: 8, speed: 10 },
      summary: "Low-latency FLUX.2 image generation.",
    }),
  ],
  "text-to-video": [
    candidate({
      endpointId: "bytedance/seedance-2.5/text-to-video",
      scores: { cost: 5, quality: 10, reliability: 8, speed: 5 },
      summary: "Long-form Seedance generation with native audio and up to 30-second shots.",
    }),
    candidate({
      endpointId: "fal-ai/veo3.1",
      scores: { cost: 4, quality: 10, reliability: 9, speed: 5 },
      summary: "Cinema-quality video generation with native audio.",
    }),
    candidate({
      endpointId: "fal-ai/veo3.1/fast",
      scores: { cost: 8, quality: 8, reliability: 9, speed: 9 },
      summary: "Faster video generation with native audio.",
    }),
    candidate({
      endpointId: "fal-ai/ltx-2.3/text-to-video",
      scores: { cost: 6, quality: 10, reliability: 9, speed: 7 },
      summary: "Latest LTX generation with native audio and supported 4K output.",
    }),
    candidate({
      endpointId: "fal-ai/kling-video/v3/pro/text-to-video",
      scores: { cost: 6, quality: 9, reliability: 8, speed: 6 },
      summary: "Realistic Kling motion with native audio and flexible shot length.",
    }),
  ],
  "image-to-video": [
    candidate({
      endpointId: "bytedance/seedance-2.5/image-to-video",
      scores: { cost: 5, quality: 10, reliability: 8, speed: 5 },
      summary: "Latest Seedance product animation with native audio and strong identity consistency.",
    }),
    candidate({
      endpointId: "fal-ai/veo3.1/image-to-video",
      scores: { cost: 4, quality: 10, reliability: 9, speed: 5 },
      summary: "High-fidelity image animation with native audio.",
    }),
    candidate({
      endpointId: "fal-ai/veo3.1/fast/image-to-video",
      scores: { cost: 8, quality: 8, reliability: 9, speed: 9 },
      summary: "Faster image animation with native audio.",
    }),
  ],
  "voiceover": [
    candidate({
      endpointId: "fal-ai/elevenlabs/tts/multilingual-v2",
      scores: { cost: 7, quality: 9, reliability: 9, speed: 8 },
      summary: "Natural multilingual text-to-speech.",
    }),
  ],
  "caption-removal": [
    candidate({
      endpointId: "fal-ai/void-video-inpainting",
      scores: { cost: 6, quality: 9, reliability: 8, speed: 6 },
      summary: "Video inpainting for removing selected caption regions.",
    }),
  ],
  "background-removal": [
    candidate({
      endpointId: "fal-ai/birefnet/v2",
      scores: { cost: 7, quality: 10, reliability: 9, speed: 7 },
      summary: "High-quality subject matting and background removal.",
    }),
    candidate({
      endpointId: "fal-ai/imageutils/rembg",
      scores: { cost: 10, quality: 7, reliability: 9, speed: 10 },
      summary: "Fast and economical background removal.",
    }),
  ],
  "video-understanding": [
    candidate({
      endpointId: "fal-ai/video-understanding",
      scores: { cost: 7, quality: 9, reliability: 9, speed: 8 },
      summary: "Video-language analysis for finding conversion-ready moments in long footage.",
    }),
  ],
};

const profileWeights: Record<FalRoutingProfile, FalModelCandidate["scores"]> = {
  quality: { cost: 0.05, quality: 0.7, reliability: 0.2, speed: 0.05 },
  balanced: { cost: 0.2, quality: 0.35, reliability: 0.2, speed: 0.25 },
  speed: { cost: 0.1, quality: 0.1, reliability: 0.15, speed: 0.65 },
  cost: { cost: 0.65, quality: 0.1, reliability: 0.1, speed: 0.15 },
};

export type FalModelSelection = {
  capability: FalCapability;
  endpointId: string;
  model?: string;
  profile: FalRoutingProfile;
  reason: string;
  source: "catalog" | "environment-override" | "user-selection";
};

function weightedScore(candidateValue: FalModelCandidate, profile: FalRoutingProfile) {
  const weights = profileWeights[profile];
  return Object.entries(weights).reduce(
    (total, [key, weight]) => total + candidateValue.scores[key as keyof typeof weights] * weight,
    0,
  );
}

export function resolveFalModel({
  capability,
  compatibleEndpointIds,
  overrides = {},
  preferredEndpointId,
  preferredModel,
  profile = "balanced",
}: {
  capability: FalCapability;
  compatibleEndpointIds?: readonly string[];
  overrides?: FalModelOverrides;
  preferredEndpointId?: string | null;
  preferredModel?: string | null;
  profile?: FalRoutingProfile;
}): FalModelSelection {
  const compatibleCandidates = compatibleEndpointIds
    ? falModelCatalog[capability].filter((candidateValue) => compatibleEndpointIds.includes(candidateValue.endpointId))
    : falModelCatalog[capability];
  const rankedCandidates = [...compatibleCandidates].sort((left, right) => {
    const scoreDifference = weightedScore(right, profile) - weightedScore(left, profile);
    return scoreDifference || left.id.localeCompare(right.id);
  });
  const [selected] = rankedCandidates;
  if (!selected) throw new Error(`No fal model is registered for ${capability}.`);

  if (preferredEndpointId || preferredModel) {
    const preferred = rankedCandidates.find(
      (candidateValue) => (!preferredEndpointId || candidateValue.endpointId === preferredEndpointId)
        && (!preferredModel || candidateValue.model === preferredModel),
    );
    if (!preferred) {
      throw new Error(`The selected model is not approved for ${capability}.`);
    }
    return {
      capability,
      endpointId: preferred.endpointId,
      model: preferred.model,
      profile,
      reason: `${preferred.summary} Explicitly selected by the user.`,
      source: "user-selection",
    };
  }

  const override = overrides[capability];
  if (override) {
    const normalized = typeof override === "string" ? { endpointId: override } : override;
    if (compatibleEndpointIds && !compatibleEndpointIds.includes(normalized.endpointId)) {
      throw new Error(`The configured override is not compatible with this ${capability} request.`);
    }
    const compatibleDefault = rankedCandidates.find(
      (candidateValue) => candidateValue.endpointId === normalized.endpointId,
    );
    return {
      capability,
      endpointId: normalized.endpointId,
      model: normalized.model ?? compatibleDefault?.model,
      profile,
      reason: `Selected by FAL_MODEL_OVERRIDES for ${capability}.`,
      source: "environment-override",
    };
  }

  return {
    capability,
    endpointId: selected.endpointId,
    model: selected.model,
    profile,
    reason: `${selected.summary} Selected for the ${profile} routing profile.`,
    source: "catalog",
  };
}
