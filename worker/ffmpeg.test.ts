import { describe, expect, it } from "vitest";
import { defaultEditSettings, emptyAnalysis } from "../src/lib/domain/video";
import { buildExportPlan, buildKeepRanges, retimeTranscript, transcriptToSrt } from "./ffmpeg";

describe("FFmpeg export planning", () => {
  it("builds keep ranges around selected silence", () => {
    const ranges = buildKeepRanges(
      { ...defaultEditSettings, removeSilences: true, trimEnd: 10 },
      { ...emptyAnalysis, silences: [{ start: 2, end: 4 }, { start: 7, end: 8 }] },
      10,
    );
    expect(ranges).toEqual([{ start: 0, end: 2 }, { start: 4, end: 7 }, { start: 8, end: 10 }]);
  });

  it("uses a video-and-audio concat graph for cleanup exports", () => {
    const plan = buildExportPlan({
      analysis: { ...emptyAnalysis, silences: [{ start: 2, end: 3 }] },
      captionsPath: null,
      duration: 8,
      hasAudio: true,
      inputPath: "/tmp/source.mp4",
      outputPath: "/tmp/output.mp4",
      settings: { ...defaultEditSettings, removeSilences: true, trimEnd: 8 },
    });
    expect(plan.args.join(" ")).toContain("concat=n=2:v=1:a=1");
    expect(plan.args).toContain("libx264");
  });

  it("creates valid caption timing blocks", () => {
    expect(
      transcriptToSrt({
        language: "en",
        text: "Hello",
        segments: [{ id: 0, start: 1.25, end: 2.5, text: "Hello", words: [] }],
      }),
    ).toContain("00:00:01,250 --> 00:00:02,500");
  });

  it("retimes captions after removed ranges", () => {
    const retimed = retimeTranscript(
      {
        language: "en",
        text: "First second phrase",
        segments: [
          { id: 0, start: 0, end: 1, text: "First", words: [] },
          { id: 1, start: 3, end: 5, text: "second phrase", words: [
            { start: 3, end: 3.7, text: "second" },
            { start: 4, end: 5, text: "phrase" },
          ] },
        ],
      },
      [{ start: 0, end: 2 }, { start: 4, end: 5 }],
    );
    expect(retimed.segments).toEqual([
      { id: 0, start: 0, end: 1, text: "First", words: [] },
      {
        id: 1,
        start: 2,
        end: 3,
        text: "phrase",
        words: [{ start: 2, end: 3, text: "phrase" }],
      },
    ]);
  });
});
