import { describe, expect, it } from "vitest";
import { falModelOverridesEnvSchema, resolveFalModel } from "./routing";

describe("fal model routing", () => {
  it("selects a balanced analysis model by capability", () => {
    const result = resolveFalModel({ capability: "content-analysis", profile: "balanced" });

    expect(result).toMatchObject({
      endpointId: "openrouter/router",
      model: "google/gemini-2.5-flash",
      source: "catalog",
    });
  });

  it("uses fast endpoint variants for the speed profile", () => {
    const result = resolveFalModel({ capability: "image-to-video", profile: "speed" });

    expect(result.endpointId).toBe("fal-ai/veo3.1/fast/image-to-video");
  });

  it("routes long-form creative scouting through video understanding", () => {
    expect(resolveFalModel({ capability: "video-understanding", profile: "quality" }))
      .toMatchObject({ endpointId: "fal-ai/video-understanding", source: "catalog" });
  });

  it("routes premium generations to the highest-quality compatible models", () => {
    expect(resolveFalModel({ capability: "text-to-image", profile: "quality" }).endpointId)
      .toBe("fal-ai/recraft/v4.1/pro/text-to-image");
    expect(resolveFalModel({ capability: "text-to-video", profile: "quality" }).endpointId)
      .toBe("fal-ai/ltx-2.3/text-to-video");
  });

  it("limits Autopilot to endpoints compatible with the requested controls", () => {
    expect(resolveFalModel({
      capability: "text-to-video",
      compatibleEndpointIds: ["bytedance/seedance-2.5/text-to-video"],
      profile: "quality",
    }).endpointId).toBe("bytedance/seedance-2.5/text-to-video");
  });

  it("routes image animation only across the compatibility-filtered models", () => {
    expect(resolveFalModel({
      capability: "image-to-video",
      compatibleEndpointIds: ["fal-ai/ltx-2.3/image-to-video", "fal-ai/veo3.1/image-to-video"],
      profile: "speed",
    }).endpointId).toBe("fal-ai/ltx-2.3/image-to-video");

    expect(resolveFalModel({
      capability: "image-to-video",
      compatibleEndpointIds: ["fal-ai/kling-video/v3/pro/image-to-video"],
      preferredEndpointId: "fal-ai/kling-video/v3/pro/image-to-video",
      profile: "quality",
    })).toMatchObject({ source: "user-selection" });
  });

  it("selects an analysis model when candidates share an endpoint", () => {
    expect(resolveFalModel({
      capability: "content-analysis",
      preferredModel: "openai/gpt-5-mini",
    })).toMatchObject({ model: "openai/gpt-5-mini", source: "user-selection" });
  });

  it("explains the selected generation model", () => {
    const selection = resolveFalModel({ capability: "text-to-video", profile: "balanced" });
    expect(selection.reason).toMatch(/Selected for the balanced routing profile/);
    expect(selection.source).toBe("catalog");
  });

  it("honors only an approved user-selected endpoint", () => {
    expect(resolveFalModel({
      capability: "background-removal",
      preferredEndpointId: "fal-ai/birefnet/v2",
      profile: "speed",
    })).toMatchObject({ endpointId: "fal-ai/birefnet/v2", source: "user-selection" });

    expect(() => resolveFalModel({
      capability: "background-removal",
      preferredEndpointId: "untrusted/paid-model",
    })).toThrow(/not approved/i);
  });

  it("allows an operations override without a code change", () => {
    const overrides = falModelOverridesEnvSchema.parse(JSON.stringify({
      "content-analysis": {
        endpointId: "openrouter/router",
        model: "anthropic/claude-sonnet-4.5",
      },
    }));
    const result = resolveFalModel({ capability: "content-analysis", overrides });

    expect(result).toMatchObject({
      model: "anthropic/claude-sonnet-4.5",
      source: "environment-override",
    });
  });

  it("retains the profile model when only a compatible endpoint is overridden", () => {
    const overrides = falModelOverridesEnvSchema.parse(JSON.stringify({
      "content-analysis": "openrouter/router",
    }));
    const result = resolveFalModel({ capability: "content-analysis", overrides, profile: "balanced" });

    expect(result.model).toBe("google/gemini-2.5-flash");
  });

  it("rejects an operations override that cannot satisfy the requested controls", () => {
    const overrides = falModelOverridesEnvSchema.parse(JSON.stringify({
      "text-to-video": "fal-ai/ltx-2.3/text-to-video",
    }));

    expect(() => resolveFalModel({
      capability: "text-to-video",
      compatibleEndpointIds: ["bytedance/seedance-2.5/text-to-video"],
      overrides,
    })).toThrow(/not compatible/i);
  });

  it("rejects malformed override configuration at startup", () => {
    expect(falModelOverridesEnvSchema.safeParse("not-json").success).toBe(false);
    expect(falModelOverridesEnvSchema.safeParse('{"unknown":"fal-ai/model"}').success).toBe(false);
  });
});
