import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  defaultEditSettings,
  editSettingsSchema,
  importClipProjectSchema,
  MAX_UPLOAD_BYTES,
  queueMessageSchema,
} from "./video";

describe("video domain validation", () => {
  it("accepts the production clip defaults", () => {
    expect(editSettingsSchema.parse(defaultEditSettings)).toEqual(defaultEditSettings);
  });

  it("upgrades legacy clip settings to the natural visual style", () => {
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

  it("accepts supported public video links only when reuse rights are confirmed", () => {
    expect(importClipProjectSchema.safeParse({
      confirmRights: true,
      name: "Podcast highlights",
      sourceUrl: "https://www.youtube.com/watch?v=example",
    }).success).toBe(true);
    expect(importClipProjectSchema.safeParse({
      confirmRights: false,
      name: "Podcast highlights",
      sourceUrl: "https://www.youtube.com/watch?v=example",
    }).success).toBe(false);
  });

  it("rejects private, credentialed, and unsupported link sources", () => {
    for (const sourceUrl of [
      "http://youtube.com/watch?v=example",
      "https://user:secret@youtube.com/watch?v=example",
      "https://localhost/video.mp4",
      "https://example.com/video.mp4",
    ]) {
      expect(importClipProjectSchema.safeParse({ confirmRights: true, name: "Unsafe", sourceUrl }).success).toBe(false);
    }
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
