import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generationJobPayloadSchema } from "./domain/generation";
import { WELCOME_CREDIT_ALLOCATION, WELCOME_IMAGE_LIMIT } from "./domain/credits";
import {
  billingMetadataForQuote,
  generationRequestForAccess,
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
    });

    expect(quote.primaryEndpoint).toBe("fal-ai/veo3.1/fast");
    expect(quote.credits).toBe(150);
  });

  it("keeps local export compute billable without inventing provider cost", () => {
    const quote = quoteProjectCredits({ durationSeconds: 120, kind: "export" });

    expect(quote.modelKey).toBe("local/ffmpeg-export");
    expect(quote.estimatedProviderCostMicros).toBe(0);
    expect(quote.credits).toBe(10);
  });

  it("prices each locked welcome image at five credits", () => {
    const input = generationRequestForAccess({
      agentId: "seedream-5-pro",
      aspectRatio: "square_hd",
      kind: "image",
      name: "Welcome image",
      profile: "quality",
      prompt: "A clean ecommerce product image on a warm studio background",
      style: "product",
    }, "welcome");
    const quote = quoteGenerationCredits(input);

    expect(input).toMatchObject({ agentId: "flux-2-turbo", profile: "cost" });
    expect(quote.primaryEndpoint).toBe("fal-ai/flux-2/turbo");
    expect(quote.credits).toBe(5);
    expect(WELCOME_CREDIT_ALLOCATION / quote.credits).toBe(WELCOME_IMAGE_LIMIT);
  });

  it("rejects welcome-credit access for non-image operations", () => {
    expect(() => generationRequestForAccess({
      agentId: "veo-3-1-fast",
      aspectRatio: "16:9",
      cameraMotion: "auto",
      duration: "8s",
      generateAudio: true,
      kind: "video",
      mood: "cinematic",
      name: "Blocked welcome video",
      profile: "speed",
      prompt: "A cinematic product reveal",
      resolution: "1080p",
    }, "welcome")).toThrow("paid subscription");
  });
});
