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
    });

    expect(buildGenerationPrompt(request)).toMatch(/orbit smoothly/i);
    expect(buildGenerationPrompt(request)).toMatch(/synchronized production-ready audio/i);
    expect(buildGenerationPrompt(request)).toMatch(/temporal consistency/i);
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
});
