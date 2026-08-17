import { ProcessError } from "./process";

export type WorkerFailureDetails = {
  code: string;
  forceTerminal: boolean;
  message: string;
  stage?: string;
};

const YOUTUBE_ACCESS_BLOCKS = [
  "sign in to confirm you’re not a bot",
  "sign in to confirm you're not a bot",
  "this video is private",
  "video unavailable",
  "members-only content",
  "join this channel to get access",
];

export function workerFailureDetails(error: unknown): WorkerFailureDetails {
  if (error instanceof ProcessError && error.command === "yt-dlp") {
    const providerMessage = `${error.message}\n${error.stderr}`.toLowerCase();
    if (YOUTUBE_ACCESS_BLOCKS.some((pattern) => providerMessage.includes(pattern))) {
      return {
        code: "VIDEO_SOURCE_ACCESS_BLOCKED",
        forceTerminal: true,
        message: "The video platform blocked server access to this link. Download a copy you have permission to use, then upload the video file directly.",
        stage: "Linked video access blocked",
      };
    }
    if (providerMessage.includes("unsupported url") || providerMessage.includes("no video formats found")) {
      return {
        code: "VIDEO_SOURCE_UNSUPPORTED",
        forceTerminal: true,
        message: "This link does not expose a downloadable video. Upload the video file directly or use another public link you have permission to edit.",
        stage: "Linked video unavailable",
      };
    }
    return {
      code: "VIDEO_SOURCE_IMPORT_FAILED",
      forceTerminal: false,
      message: "The linked video could not be imported. Editing App will retry automatically.",
    };
  }

  if (error instanceof ProcessError) {
    return {
      code: "FFMPEG_PROCESS_ERROR",
      forceTerminal: false,
      message: `${error.message}: ${error.stderr.slice(-500)}`.slice(0, 1000),
    };
  }

  return {
    code: "VIDEO_PIPELINE_ERROR",
    forceTerminal: false,
    message: (error instanceof Error ? error.message : "Unknown worker error").slice(0, 1000),
  };
}
