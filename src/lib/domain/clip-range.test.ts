import { describe, expect, it } from "vitest";
import {
  clipRangeValidationError,
  normalizeClipRange,
  normalizeMediaDuration,
} from "./clip-range";

describe("AI Clipper ranges", () => {
  it("does not invent a 0.1-second duration before media metadata exists", () => {
    expect(normalizeMediaDuration(0)).toBeNull();
    expect(normalizeMediaDuration(Number.NaN)).toBeNull();
  });

  it("initializes a full-video range from the real duration", () => {
    expect(normalizeClipRange({ duration: 94.237, end: null, start: 0 })).toEqual({
      end: 94.237,
      start: 0,
    });
  });

  it("clamps both handles while preserving the minimum range", () => {
    expect(normalizeClipRange({ duration: 10, end: 25, start: 12 })).toEqual({
      end: 10,
      start: 9.9,
    });
    expect(normalizeClipRange({ duration: 10, end: 4, start: 6 })).toEqual({
      end: 6.1,
      start: 6,
    });
  });

  it("rejects ranges that the export worker cannot safely render", () => {
    expect(clipRangeValidationError({ duration: 60, end: 50, start: 12 })).toBeNull();
    expect(clipRangeValidationError({ duration: 60, end: null, start: 60 })).toMatch(/before/);
    expect(clipRangeValidationError({ duration: 60, end: 60.2, start: 0 })).toMatch(/exceeds/);
    expect(clipRangeValidationError({ duration: 60, end: 5.05, start: 5 })).toMatch(/0.1/);
  });
});
