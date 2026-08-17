import { describe, expect, it } from "vitest";
import {
  localContentAnalysis,
  parseAnalysisResult,
  resilientContentAnalysis,
} from "./analysis";

const analysisInput = {
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
};

describe("local content analysis", () => {
  it("finds timestamped filler words and ranks spoken moments", () => {
    const result = localContentAnalysis(analysisInput);
    expect(result.fillers).toHaveLength(1);
    expect(result.highlights[0]?.reason).toContain("launch story");
  });

  it("repairs model highlights that omit a reason", () => {
    const result = parseAnalysisResult(JSON.stringify({
      fillers: [],
      highlights: [
        { end: 4, score: 1.4, start: 1 },
        { end: 8, reason: "", score: -1, start: 5 },
      ],
    }), 12);

    expect(result.highlights).toEqual([
      { end: 4, reason: "Strong self-contained moment detected by AI.", score: 1, start: 1 },
      { end: 8, reason: "Strong self-contained moment detected by AI.", score: 0, start: 5 },
    ]);
  });

  it("drops invalid suggestions without rejecting usable model output", () => {
    const result = parseAnalysisResult(JSON.stringify({
      fillers: [{ end: 3, start: 4 }, { end: "2", start: "1", text: "um" }],
      highlights: [{ end: 20, start: 15 }, { end: "9", start: "6" }],
    }), 12);

    expect(result.fillers).toEqual([{ end: 2, start: 1, text: "um" }]);
    expect(result.highlights).toEqual([
      { end: 9, reason: "Strong self-contained moment detected by AI.", score: 0.5, start: 6 },
    ]);
  });

  it("uses local moments when the provider returns malformed JSON", () => {
    const result = resilientContentAnalysis("not-json", analysisInput);

    expect(result.fillers).toHaveLength(1);
    expect(result.highlights[0]?.reason).toContain("launch story");
  });
});
