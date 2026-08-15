import { describe, expect, it } from "vitest";
import {
  buildGenerationPrompt,
  generationJobPayloadSchema,
  generationRequestSchema,
} from "./generation";

describe("AI generation domain", () => {
  it("accepts art-directed image requests and rejects unknown controls", () => {
    const request = generationRequestSchema.parse({
      aspectRatio: "landscape_16_9",
      kind: "image",
      name: "Launch visual",
      profile: "quality",
      prompt: "A sculptural speaker in a dark studio",
      style: "product",
    });

    expect(request.kind).toBe("image");
    expect(generationRequestSchema.safeParse({ ...request, provider: "untrusted-model" }).success).toBe(false);
  });

  it("adds production direction to video briefs", () => {
    const request = generationRequestSchema.parse({
      aspectRatio: "16:9",
      cameraMotion: "orbit",
      duration: "8s",
      generateAudio: true,
      kind: "video",
      mood: "luxury",
      name: "Watch film",
      profile: "balanced",
      prompt: "A precision watch assembles itself on black glass",
      resolution: "1080p",
      visualStyle: "cartoon",
    });

    expect(buildGenerationPrompt(request)).toMatch(/orbit smoothly/i);
    expect(buildGenerationPrompt(request)).toMatch(/synchronized production-ready audio/i);
    expect(buildGenerationPrompt(request)).toMatch(/temporal consistency/i);
    expect(buildGenerationPrompt(request)).toMatch(/animated-cartoon/i);
  });

  it("accepts Seedance long shots only at its supported resolution", () => {
    const request = {
      agentId: "seedance-2-5",
      aspectRatio: "16:9",
      duration: "30s",
      generateAudio: true,
      kind: "video",
      name: "Product story",
      profile: "quality",
      prompt: "A premium product story told as one coherent shot",
      resolution: "720p",
    } as const;

    expect(generationRequestSchema.safeParse(request).success).toBe(true);
    expect(generationRequestSchema.safeParse({ ...request, resolution: "1080p" }).success).toBe(false);
  });

  it("requires a request ID in durable worker payloads", () => {
    expect(generationJobPayloadSchema.safeParse({
      aspectRatio: "square_hd",
      kind: "image",
      name: "Image",
      profile: "speed",
      prompt: "A green glass sculpture",
      style: "auto",
    }).success).toBe(false);
  });

  it("accepts a private background-removal source and rejects arbitrary agents", () => {
    const request = generationRequestSchema.parse({
      agentId: "birefnet-v2",
      kind: "background_removal",
      name: "Product cutout",
      profile: "quality",
      prompt: "Remove the image background with clean edges.",
      sourceBucket: "background-inputs",
      sourceMime: "image/png",
      sourcePath: "a4bd6f8b-2330-4e39-b06a-000000000000/source.png",
    });
    expect(request.kind).toBe("background_removal");
    expect(generationRequestSchema.safeParse({ ...request, agentId: "arbitrary-model" }).success).toBe(false);
  });

  it("validates product-page performance creatives and adds platform guardrails", () => {
    const request = generationRequestSchema.parse({
      agentId: "veo-3-1-performance",
      audience: "Independent skincare shoppers",
      callToAction: "Shop now",
      duration: "8s",
      kind: "performance_creative",
      name: "Product launch ad",
      platform: "instagram",
      profile: "quality",
      prompt: "Lead with texture and a credible everyday-use moment.",
      source: { type: "product_url", url: "https://shop.example.com/products/serum" },
    });

    expect(buildGenerationPrompt(request)).toMatch(/Instagram Reels \+ Stories/i);
    expect(buildGenerationPrompt(request)).toMatch(/Do not invent discounts/i);
    expect(generationRequestSchema.safeParse({
      ...request,
      source: { type: "product_url", url: "http://127.0.0.1/product" },
    }).success).toBe(false);
  });

  it("accepts source-aware product image ads", () => {
    const request = generationRequestSchema.parse({
      agentId: "nano-banana-2-product-ad",
      audience: "Home coffee enthusiasts",
      callToAction: "Shop now",
      duration: "8s",
      kind: "performance_creative",
      name: "Coffee launch image",
      outputType: "image",
      platform: "facebook",
      profile: "quality",
      prompt: "Create a clean product launch ad with one clear benefit.",
      source: { type: "product_url", url: "https://shop.example.com/products/coffee-maker" },
    });

    expect(buildGenerationPrompt(request)).toMatch(/static advertisement/i);
    expect(buildGenerationPrompt(request)).toMatch(/Feed image · 1:1/i);
  });

  it("accepts image ads for local businesses without a product URL", () => {
    const request = generationRequestSchema.parse({
      agentId: "recraft-4-1-static-ad",
      audience: "Families living near the clinic",
      callToAction: "Book an appointment",
      kind: "performance_creative",
      name: "Local clinic campaign",
      outputType: "image",
      platform: "instagram",
      profile: "quality",
      prompt: "Create a trustworthy awareness ad with a calm, welcoming visual hierarchy.",
      source: {
        businessDescription: "A family dental clinic offering preventive care and routine appointments.",
        businessName: "Riverside Dental Studio",
        location: "Lahore",
        type: "business_brief",
      },
    });

    expect(request.kind).toBe("performance_creative");
    if (request.kind !== "performance_creative") throw new Error("Expected a performance creative request");
    expect(request.source.type).toBe("business_brief");
  });

  it("accepts an owned-project reference for long-video creative scouting", () => {
    const request = generationRequestSchema.parse({
      agentId: "video-understanding-scout",
      audience: "Marketing leaders",
      callToAction: "Book a demo",
      duration: "30s",
      kind: "performance_creative",
      name: "Founder clip",
      platform: "youtube",
      profile: "quality",
      prompt: "Find the clearest customer-outcome explanation.",
      source: { projectId: "d7a9aeb0-726e-4c70-8dbf-81a760cd9562", type: "long_video" },
    });

    expect(request.kind).toBe("performance_creative");
    if (request.kind !== "performance_creative") throw new Error("Expected a performance creative request");
    expect(request.source.type).toBe("long_video");
  });
});
