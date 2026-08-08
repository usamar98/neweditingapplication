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

  it("rejects malformed override configuration at startup", () => {
    expect(falModelOverridesEnvSchema.safeParse("not-json").success).toBe(false);
    expect(falModelOverridesEnvSchema.safeParse('{"unknown":"fal-ai/model"}').success).toBe(false);
  });
});
