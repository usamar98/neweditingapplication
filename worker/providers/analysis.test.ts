import { describe, expect, it } from "vitest";
import { localContentAnalysis } from "./analysis";

describe("local content analysis", () => {
  it("finds timestamped filler words and ranks spoken moments", () => {
    const result = localContentAnalysis({
      duration: 12,
      scenes: [{ start: 0, end: 12, score: 0.4 }],
      silences: [],
      transcript: {
        language: "en",
        text: "Um, this is the launch story.",
        segments: [
          {
            id: 0,
            start: 0,
            end: 4,
            text: "Um, this is the launch story.",
            words: [
              { start: 0, end: 0.3, text: "Um" },
              { start: 0.4, end: 0.8, text: "this" },
            ],
          },
        ],
      },
    });
    expect(result.fillers).toHaveLength(1);
    expect(result.highlights[0]?.reason).toContain("launch story");
  });
});
