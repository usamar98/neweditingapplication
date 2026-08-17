import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generationJobPayloadSchema } from "./domain/generation";
import {
  billingMetadataForQuote,
  quoteGenerationCredits,
  quoteProjectCredits,
} from "./credits";

describe("credit quotes", () => {
  it("prices premium video by the selected model, duration, audio, and resolution", () => {
    const quote = quoteGenerationCredits({
      agentId: "veo-3-1",
      aspectRatio: "16:9",
      cameraMotion: "auto",
      duration: "8s",
      generateAudio: true,
      kind: "video",
      mood: "cinematic",
      name: "Premium launch",
      profile: "quality",
      prompt: "A premium product launch in a cinematic studio",
      resolution: "1080p",
      visualStyle: "cinematic",
    });

    expect(quote.primaryEndpoint).toBe("fal-ai/veo3.1");
    expect(quote.estimatedProviderCostMicros).toBe(3_200_000);
    expect(quote.credits).toBe(400);
    expect(generationJobPayloadSchema.safeParse({
      agentId: "veo-3-1",
      aspectRatio: "16:9",
      billing: billingMetadataForQuote(quote),
      cameraMotion: "auto",
      duration: "8s",
      generateAudio: true,
      kind: "video",
      mood: "cinematic",
      name: "Premium launch",
      profile: "quality",
      prompt: "A premium product launch in a cinematic studio",
      requestId: "4d76d3c2-f47d-40b1-82fc-36c3847fcf25",
      resolution: "1080p",
    }).success).toBe(true);
  });

  it("charges fewer credits for a fast video route", () => {
    const quote = quoteGenerationCredits({
      agentId: "veo-3-1-fast",
      aspectRatio: "9:16",
      cameraMotion: "handheld",
      duration: "8s",
      generateAudio: true,
      kind: "video",
      mood: "energetic",
      name: "Social variant",
      profile: "speed",
      prompt: "A fast social product reveal with synchronized sound",
      resolution: "1080p",
      visualStyle: "commercial",
    });

    expect(quote.primaryEndpoint).toBe("fal-ai/veo3.1/fast");
    expect(quote.credits).toBe(150);
  });

  it("reserves model-specific image-to-video credits before provider work", () => {
    const quote = quoteGenerationCredits({
      agentId: "ltx-2-3-image",
      aspectRatio: "16:9",
      cameraMotion: "orbit",
      duration: "6s",
      generateAudio: true,
      kind: "image_to_video",
      motionStrength: "balanced",
      name: "Animated campaign frame",
      negativePrompt: "flicker, distortion",
      preserveSubject: true,
      profile: "quality",
      prompt: "A smooth orbit reveals the product materials.",
      resolution: "4k",
      sourceBucket: "video-assets",
      sourceMime: "image/png",
      sourcePath: "a4bd6f8b-2330-4e39-b06a-000000000000/image-to-video/source.png",
      visualStyle: "commercial",
    });

    expect(quote.operationKey).toBe("generate_image_to_video");
    expect(quote.primaryEndpoint).toBe("fal-ai/ltx-2.3/image-to-video");
    expect(quote.estimatedProviderCostMicros).toBe(1_920_000);
    expect(quote.credits).toBe(240);
  });

  it("keeps local export compute billable without inventing provider cost", () => {
    const quote = quoteProjectCredits({ durationSeconds: 120, kind: "export" });

    expect(quote.modelKey).toBe("local/ffmpeg-export");
    expect(quote.estimatedProviderCostMicros).toBe(0);
    expect(quote.credits).toBe(10);
  });

});
