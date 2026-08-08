import { readFile, writeFile } from "node:fs/promises";
import type { EditSettings, Transcript, VideoAnalysis } from "../src/lib/domain/video";
import { getWorkerConfig } from "./config";
import { runProcess } from "./process";

export type MediaProbe = {
  duration: number;
  frameRate: number;
  hasAudio: boolean;
  height: number;
  width: number;
};

type ExportPlan = {
  args: string[];
  outputDuration: number;
};

function parseFrameRate(value: string | undefined) {
  if (!value) return 30;
  const [numerator, denominator = 1] = value.split("/").map(Number);
  const rate = numerator / denominator;
  return Number.isFinite(rate) && rate > 0 ? rate : 30;
}

export async function probeMedia(inputPath: string): Promise<MediaProbe> {
  const { FFPROBE_PATH } = getWorkerConfig();
  const { stdout } = await runProcess({
    command: FFPROBE_PATH,
    args: ["-v", "error", "-show_streams", "-show_format", "-print_format", "json", inputPath],
    timeoutMs: 120000,
  });
  const result = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{
      avg_frame_rate?: string;
      codec_type?: string;
      duration?: string;
      height?: number;
      r_frame_rate?: string;
      width?: number;
    }>;
  };
  const video = result.streams?.find((stream) => stream.codec_type === "video");
  if (!video?.width || !video.height) throw new Error("The uploaded file does not contain a readable video stream.");
  const duration = Number(result.format?.duration ?? video.duration ?? 0);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("The uploaded video has an invalid duration.");
  return {
    duration,
    frameRate: parseFrameRate(video.avg_frame_rate ?? video.r_frame_rate),
    hasAudio: Boolean(result.streams?.some((stream) => stream.codec_type === "audio")),
    height: video.height,
    width: video.width,
  };
}

export async function detectScenes(inputPath: string, duration: number, threshold = 0.32) {
  const { FFMPEG_PATH } = getWorkerConfig();
  const timestamps: number[] = [0];
  let stderrBuffer = "";
  await runProcess({
    command: FFMPEG_PATH,
    args: [
      "-hide_banner",
      "-i",
      inputPath,
      "-filter:v",
      `select=gt(scene\\,${threshold}),showinfo`,
      "-an",
      "-f",
      "null",
      "-",
    ],
    onStderr(chunk) {
      stderrBuffer += chunk;
      const lines = stderrBuffer.split(/\r?\n/);
      stderrBuffer = lines.pop() ?? "";
      for (const line of lines) {
        for (const match of line.matchAll(/pts_time:([0-9.]+)/g)) {
          const timestamp = Number(match[1]);
          if (timestamp > 0.2 && timestamp < duration - 0.2) timestamps.push(timestamp);
        }
      }
    },
  });
  const unique = [...new Set(timestamps.map((timestamp) => Number(timestamp.toFixed(3))))].sort((a, b) => a - b);
  return unique.map((start, index) => ({
    end: unique[index + 1] ?? duration,
    score: threshold,
    start,
  }));
}

export async function detectSilences(inputPath: string, hasAudio: boolean) {
  if (!hasAudio) return [];
  const { FFMPEG_PATH } = getWorkerConfig();
  const starts: number[] = [];
  const ranges: Array<{ end: number; start: number }> = [];
  let stderrBuffer = "";
  await runProcess({
    command: FFMPEG_PATH,
    args: ["-hide_banner", "-i", inputPath, "-af", "silencedetect=noise=-35dB:d=0.45", "-f", "null", "-"],
    onStderr(chunk) {
      stderrBuffer += chunk;
      const lines = stderrBuffer.split(/\r?\n/);
      stderrBuffer = lines.pop() ?? "";
      for (const line of lines) {
        for (const match of line.matchAll(/silence_start:\s*([0-9.]+)/g)) starts.push(Number(match[1]));
        for (const match of line.matchAll(/silence_end:\s*([0-9.]+)/g)) {
          const start = starts.shift();
          const end = Number(match[1]);
          if (start !== undefined && end - start >= 0.45) ranges.push({ end, start });
        }
      }
    },
  });
  return ranges;
}

export async function extractSpeechAudio(inputPath: string, outputPath: string) {
  const { FFMPEG_PATH } = getWorkerConfig();
  await runProcess({
    command: FFMPEG_PATH,
    args: ["-hide_banner", "-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libmp3lame", "-b:a", "48k", outputPath],
  });
}

export async function createThumbnail(inputPath: string, outputPath: string, duration: number) {
  const { FFMPEG_PATH } = getWorkerConfig();
  await runProcess({
    command: FFMPEG_PATH,
    args: ["-hide_banner", "-y", "-ss", Math.min(duration * 0.15, 30).toFixed(3), "-i", inputPath, "-frames:v", "1", "-vf", "scale='min(1280,iw)':-2", "-q:v", "3", outputPath],
    timeoutMs: 300000,
  });
}

function mergeCuts(cuts: Array<{ end: number; start: number }>, start: number, end: number) {
  const normalized = cuts
    .map((cut) => ({ end: Math.min(end, cut.end), start: Math.max(start, cut.start) }))
    .filter((cut) => cut.end - cut.start >= 0.12)
    .sort((a, b) => a.start - b.start);
  const merged: Array<{ end: number; start: number }> = [];
  for (const cut of normalized) {
    const previous = merged.at(-1);
    if (previous && cut.start <= previous.end + 0.05) previous.end = Math.max(previous.end, cut.end);
    else merged.push({ ...cut });
  }
  return merged;
}

export function buildKeepRanges(
  settings: EditSettings,
  analysis: VideoAnalysis,
  duration: number,
) {
  const start = Math.min(settings.trimStart, duration - 0.05);
  const end = Math.min(settings.trimEnd ?? duration, duration);
  const cuts = mergeCuts(
    [
      ...(settings.removeSilences ? analysis.silences : []),
      ...(settings.removeFillers ? analysis.fillers : []),
    ],
    start,
    end,
  );
  if (cuts.length === 0) return [{ end, start }];
  const keeps: Array<{ end: number; start: number }> = [];
  let cursor = start;
  for (const cut of cuts) {
    if (cut.start - cursor >= 0.12) keeps.push({ end: cut.start, start: cursor });
    cursor = Math.max(cursor, cut.end);
  }
  if (end - cursor >= 0.12) keeps.push({ end, start: cursor });
  return keeps.length > 0 ? keeps : [{ end, start }];
}

function aspectFilter(aspectRatio: EditSettings["aspectRatio"]) {
  switch (aspectRatio) {
    case "tiktok":
    case "instagram-reel":
      return "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1";
    case "instagram-square":
      return "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,setsar=1";
    case "youtube":
      return "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1";
    default:
      return "scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1";
  }
}

function assColor(hex: string, opacity = 1) {
  const value = hex.replace("#", "");
  const red = value.slice(0, 2);
  const green = value.slice(2, 4);
  const blue = value.slice(4, 6);
  const alpha = Math.round((1 - opacity) * 255).toString(16).padStart(2, "0");
  return `&H${alpha}${blue}${green}${red}`.toUpperCase();
}

function escapeFilterPath(filePath: string) {
  return filePath.replaceAll("\\", "/").replace(":", "\\:").replaceAll("'", "\\'");
}

export function buildExportPlan({
  analysis,
  captionsPath,
  duration,
  hasAudio,
  inputPath,
  outputPath,
  settings,
}: {
  analysis: VideoAnalysis;
  captionsPath: string | null;
  duration: number;
  hasAudio: boolean;
  inputPath: string;
  outputPath: string;
  settings: EditSettings;
}): ExportPlan {
  const keeps = buildKeepRanges(settings, analysis, duration);
  const shouldConcat = keeps.length > 1 || keeps[0].start > settings.trimStart + 0.01;
  const includeAudio = hasAudio && !settings.audio.muted;
  const videoFilters = [aspectFilter(settings.aspectRatio)];
  if (captionsPath && settings.captions.enabled) {
    const alignment = settings.captions.position === "top" ? 8 : settings.captions.position === "middle" ? 5 : 2;
    const style = [
      `FontName=${settings.captions.font}`,
      `FontSize=${settings.captions.fontSize}`,
      `PrimaryColour=${assColor(settings.captions.textColor)}`,
      `BackColour=${assColor(settings.captions.backgroundColor, settings.captions.backgroundOpacity)}`,
      `BorderStyle=3`,
      `Outline=0`,
      `Shadow=0`,
      `Alignment=${alignment}`,
      `MarginV=48`,
    ].join(",");
    videoFilters.push(`subtitles='${escapeFilterPath(captionsPath)}':force_style='${style}'`);
  }
  const audioFilters = [
    ...(settings.audio.noiseReduction ? ["afftdn=nf=-25"] : []),
    `volume=${settings.audio.volume.toFixed(2)}`,
  ];
  const args = ["-hide_banner", "-y", "-progress", "pipe:2", "-nostats"];
  let outputDuration = keeps.reduce((sum, range) => sum + range.end - range.start, 0);

  if (!shouldConcat && keeps.length === 1) {
    const range = keeps[0];
    outputDuration = range.end - range.start;
    args.push("-ss", range.start.toFixed(3), "-t", outputDuration.toFixed(3), "-i", inputPath);
    args.push("-map", "0:v:0", "-vf", videoFilters.join(","));
    if (includeAudio) args.push("-map", "0:a:0?", "-af", audioFilters.join(","), "-c:a", "aac", "-b:a", "192k");
    else args.push("-an");
  } else {
    args.push("-i", inputPath);
    const filters: string[] = [];
    keeps.forEach((range, index) => {
      filters.push(`[0:v]trim=start=${range.start.toFixed(3)}:end=${range.end.toFixed(3)},setpts=PTS-STARTPTS[v${index}]`);
      if (includeAudio) filters.push(`[0:a]atrim=start=${range.start.toFixed(3)}:end=${range.end.toFixed(3)},asetpts=PTS-STARTPTS[a${index}]`);
    });
    const concatInputs = keeps.map((_, index) => includeAudio ? `[v${index}][a${index}]` : `[v${index}]`).join("");
    filters.push(`${concatInputs}concat=n=${keeps.length}:v=1:a=${includeAudio ? 1 : 0}[basev]${includeAudio ? "[basea]" : ""}`);
    filters.push(`[basev]${videoFilters.join(",")}[outv]`);
    if (includeAudio) filters.push(`[basea]${audioFilters.join(",")}[outa]`);
    args.push("-filter_complex", filters.join(";"), "-map", "[outv]");
    if (includeAudio) args.push("-map", "[outa]", "-c:a", "aac", "-b:a", "192k");
    else args.push("-an");
  }

  args.push(
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-max_muxing_queue_size",
    "2048",
    "-metadata",
    "comment=Created with Editing App",
    outputPath,
  );
  return { args, outputDuration };
}

export async function renderExport(plan: ExportPlan, onProgress: (progress: number) => void) {
  const { FFMPEG_PATH } = getWorkerConfig();
  let progressBuffer = "";
  await runProcess({
    command: FFMPEG_PATH,
    args: plan.args,
    onStderr(chunk) {
      progressBuffer += chunk;
      const lines = progressBuffer.split(/\r?\n/);
      progressBuffer = lines.pop() ?? "";
      for (const line of lines) {
        const match = line.match(/^out_time_(?:ms|us)=([0-9]+)/);
        if (match) {
          const seconds = Number(match[1]) / 1_000_000;
          onProgress(Math.min(1, seconds / Math.max(plan.outputDuration, 0.1)));
        }
      }
    },
  });
}

function srtTimestamp(seconds: number) {
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((milliseconds % 60_000) / 1000);
  const millis = milliseconds % 1000;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${millis.toString().padStart(3, "0")}`;
}

export function transcriptToSrt(transcript: Transcript) {
  return transcript.segments
    .map((segment, index) => `${index + 1}\n${srtTimestamp(segment.start)} --> ${srtTimestamp(segment.end)}\n${segment.text.replaceAll("\n", " ").trim()}\n`)
    .join("\n");
}

export function transcriptToVtt(transcript: Transcript) {
  return `WEBVTT\n\n${transcriptToSrt(transcript).replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")}`;
}

export function retimeTranscript(
  transcript: Transcript,
  keepRanges: Array<{ end: number; start: number }>,
): Transcript {
  let elapsed = 0;
  let segmentId = 0;
  const segments: Transcript["segments"] = [];

  for (const range of keepRanges) {
    for (const segment of transcript.segments) {
      const overlapStart = Math.max(segment.start, range.start);
      const overlapEnd = Math.min(segment.end, range.end);
      if (overlapEnd - overlapStart < 0.04) continue;

      const words = segment.words
        .filter((word) => word.end > overlapStart && word.start < overlapEnd)
        .map((word) => ({
          end: elapsed + Math.min(word.end, range.end) - range.start,
          start: elapsed + Math.max(word.start, range.start) - range.start,
          text: word.text,
        }));
      const text = words.length > 0
        ? words.map((word) => word.text).join(" ").replace(/\s+([,.!?;:])/g, "$1")
        : segment.text;
      segments.push({
        end: elapsed + overlapEnd - range.start,
        id: segmentId++,
        start: elapsed + overlapStart - range.start,
        text,
        words,
      });
    }
    elapsed += range.end - range.start;
  }

  return {
    language: transcript.language,
    segments,
    text: segments.map((segment) => segment.text).join(" ").trim(),
  };
}

export async function writeCaptionsFile(path: string, transcript: Transcript) {
  await writeFile(path, transcriptToSrt(transcript), "utf8");
}

export async function readJsonFile<T>(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as T;
}
