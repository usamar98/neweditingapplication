import { describe, expect, it } from "vitest";
import { ProcessError } from "./process";
import { workerFailureDetails } from "./failures";

describe("worker failure classification", () => {
  it("stops retrying links blocked by YouTube bot protection", () => {
    const result = workerFailureDetails(new ProcessError(
      "yt-dlp exited with code 1",
      "yt-dlp",
      1,
      "ERROR: Sign in to confirm you’re not a bot.",
    ));

    expect(result).toEqual({
      code: "VIDEO_SOURCE_ACCESS_BLOCKED",
      forceTerminal: true,
      message: "The video platform blocked server access to this link. Download a copy you have permission to use, then upload the video file directly.",
      stage: "Linked video access blocked",
    });
  });

  it("keeps transient link-import failures retryable without exposing provider output", () => {
    const result = workerFailureDetails(new ProcessError(
      "yt-dlp exited with code 1",
      "yt-dlp",
      1,
      "Temporary network timeout for a private infrastructure address",
    ));

    expect(result.forceTerminal).toBe(false);
    expect(result.code).toBe("VIDEO_SOURCE_IMPORT_FAILED");
    expect(result.message).not.toContain("private infrastructure");
  });
});
