import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  defaultEditSettings,
  editSettingsSchema,
  MAX_UPLOAD_BYTES,
  queueMessageSchema,
} from "./video";

describe("video domain validation", () => {
  it("accepts the production editor defaults", () => {
    expect(editSettingsSchema.parse(defaultEditSettings)).toEqual(defaultEditSettings);
  });

  it("upgrades legacy editor settings to the natural visual style", () => {
    const legacySettings: Partial<typeof defaultEditSettings> = { ...defaultEditSettings };
    delete legacySettings.visualStyle;
    expect(editSettingsSchema.parse(legacySettings).visualStyle).toBe("natural");
  });

  it("rejects inverted trim ranges", () => {
    expect(() =>
      editSettingsSchema.parse({
        ...defaultEditSettings,
        trimStart: 8,
        trimEnd: 3,
      }),
    ).toThrow(/Trim end/);
  });

  it("rejects oversized and unsupported uploads", () => {
    expect(
      createProjectSchema.safeParse({
        fileName: "clip.avi",
        mimeType: "video/x-msvideo",
        name: "Clip",
        size: MAX_UPLOAD_BYTES + 1,
      }).success,
    ).toBe(false);
  });

  it("requires a fully owned queue envelope", () => {
    expect(
      queueMessageSchema.safeParse({
        jobId: crypto.randomUUID(),
        kind: "analyze",
        projectId: crypto.randomUUID(),
      }).success,
    ).toBe(false);
  });

  it("accepts a fully owned AI generation queue envelope", () => {
    expect(
      queueMessageSchema.safeParse({
        generationId: crypto.randomUUID(),
        jobId: crypto.randomUUID(),
        kind: "generate_video",
        userId: crypto.randomUUID(),
      }).success,
    ).toBe(true);
  });
});
