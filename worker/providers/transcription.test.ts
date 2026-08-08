import { describe, expect, it } from "vitest";
import { normalizeFalTranscript } from "./transcription";

describe("fal transcript normalization", () => {
  it("turns word chunks into caption-ready timestamped segments", () => {
    const transcript = normalizeFalTranscript({
      chunks: [
        { text: "Welcome", timestamp: [0, 0.5] },
        { text: "back.", timestamp: [0.55, 1] },
        { text: "Today", timestamp: [2.2, 2.6] },
        { text: "we", timestamp: [2.65, 2.8] },
        { text: "launch!", timestamp: [2.85, 3.4] },
      ],
      inferred_languages: ["en"],
      text: "Welcome back. Today we launch!",
    });

    expect(transcript.language).toBe("en");
    expect(transcript.segments).toHaveLength(2);
    expect(transcript.segments[0]).toMatchObject({ end: 1, start: 0, text: "Welcome back." });
    expect(transcript.segments[1]?.words).toHaveLength(3);
  });

  it("ignores chunks without usable timestamps", () => {
    const transcript = normalizeFalTranscript({
      chunks: [{ text: "Untimed", timestamp: [null, null] }],
      inferred_languages: [],
      text: "Untimed",
    });

    expect(transcript.segments).toEqual([]);
    expect(transcript.text).toBe("Untimed");
  });
});
