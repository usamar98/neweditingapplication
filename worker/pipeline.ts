import { stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  editSettingsSchema,
  emptyAnalysis,
  emptyTranscript,
  VIDEO_ASSET_BUCKET,
  VIDEO_OUTPUT_BUCKET,
  VIDEO_SOURCE_BUCKET,
  type Transcript,
  type VideoAnalysis,
} from "../src/lib/domain/video";
import type { Database, Json, Tables } from "../src/types/database.generated";
import type { WorkerConfig } from "./config";
import {
  buildExportPlan,
  buildKeepRanges,
  createThumbnail,
  detectScenes,
  detectSilences,
  extractSpeechAudio,
  probeMedia,
  renderExport,
  retimeTranscript,
  transcriptToVtt,
  writeCaptionsFile,
} from "./ffmpeg";
import { createContentAnalysisProvider } from "./providers/analysis";
import { createTranscriptionProvider } from "./providers/transcription";
import {
  downloadStorageObject,
  uploadLargeObjectResumably,
  uploadSmallObject,
} from "./storage";

type Job = Tables<"jobs">;
type Project = Tables<"projects">;

export type ProgressReporter = (stage: string, progress: number) => Promise<void>;

type PipelineContext = {
  config: WorkerConfig;
  job: Job;
  project: Project;
  report: ProgressReporter;
  supabase: SupabaseClient<Database>;
  tempDir: string;
};

function asJson(value: unknown) {
  return value as Json;
}

async function updateProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
  values: Database["public"]["Tables"]["projects"]["Update"],
) {
  const { error } = await supabase.from("projects").update(values).eq("id", projectId);
  if (error) throw new Error(`Unable to update project: ${error.message}`);
}

async function recordUsage(
  context: PipelineContext,
  eventType: Database["public"]["Tables"]["usage_events"]["Insert"]["event_type"],
  units: number,
  metadata: Json,
) {
  const { error } = await context.supabase.from("usage_events").insert({
    event_type: eventType,
    job_id: context.job.id,
    metadata,
    project_id: context.project.id,
    units,
    user_id: context.project.user_id,
  });
  if (error) throw new Error(`Unable to record usage: ${error.message}`);
}

async function analyzeVideo(context: PipelineContext) {
  const sourcePath = join(context.tempDir, "source-video");
  const audioPath = join(context.tempDir, "speech.mp3");
  const thumbnailPath = join(context.tempDir, "thumbnail.jpg");
  const transcriptPath = join(context.tempDir, "transcript.json");
  const captionsPath = join(context.tempDir, "captions.vtt");

  await context.report("Downloading source video", 5);
  await downloadStorageObject({
    bucket: VIDEO_SOURCE_BUCKET,
    destination: sourcePath,
    objectPath: context.project.source_path,
    supabase: context.supabase,
  });

  await context.report("Inspecting media streams", 14);
  const probe = await probeMedia(sourcePath);
  const [scenes, silences] = await Promise.all([
    (async () => {
      await context.report("Detecting scene changes", 22);
      return detectScenes(sourcePath, probe.duration);
    })(),
    (async () => {
      await context.report("Finding quiet sections", 30);
      return detectSilences(sourcePath, probe.hasAudio);
    })(),
    createThumbnail(sourcePath, thumbnailPath, probe.duration),
  ]);

  let transcript: Transcript = emptyTranscript;
  const transcriptionProvider = createTranscriptionProvider(context.config);
  if (probe.hasAudio) {
    await context.report("Preparing speech audio", 42);
    await extractSpeechAudio(sourcePath, audioPath);
    await context.report(`Transcribing with ${transcriptionProvider.name}`, 50);
    transcript = await transcriptionProvider.transcribe(audioPath);
  }

  const analysisProvider = createContentAnalysisProvider(context.config);
  await context.report(`Analyzing content with ${analysisProvider.name}`, 68);
  const content = await analysisProvider.analyze({
    duration: probe.duration,
    scenes,
    silences,
    transcript,
  });
  const analysis: VideoAnalysis = { scenes, silences, ...content };

  await writeFile(transcriptPath, JSON.stringify(transcript), "utf8");
  await writeFile(captionsPath, transcriptToVtt(transcript), "utf8");
  const assetPrefix = `${context.project.user_id}/${context.project.id}/analysis/${context.job.id}`;
  const thumbnailObjectPath = `${assetPrefix}/thumbnail.jpg`;
  await context.report("Saving analysis and captions", 80);
  await Promise.all([
    uploadSmallObject({
      bucket: VIDEO_ASSET_BUCKET,
      contentType: "image/jpeg",
      filePath: thumbnailPath,
      objectPath: thumbnailObjectPath,
      supabase: context.supabase,
    }),
    uploadSmallObject({
      bucket: VIDEO_ASSET_BUCKET,
      contentType: "application/json",
      filePath: transcriptPath,
      objectPath: `${assetPrefix}/transcript.json`,
      supabase: context.supabase,
    }),
    uploadSmallObject({
      bucket: VIDEO_ASSET_BUCKET,
      contentType: "text/vtt",
      filePath: captionsPath,
      objectPath: `${assetPrefix}/captions.vtt`,
      supabase: context.supabase,
    }),
  ]);

  await updateProject(context.supabase, context.project.id, {
    analysis: asJson(analysis),
    duration_seconds: probe.duration,
    frame_rate: probe.frameRate,
    height: probe.height,
    last_error: null,
    status: "ready",
    thumbnail_path: thumbnailObjectPath,
    transcript: asJson(transcript),
    width: probe.width,
  });
  await Promise.all([
    recordUsage(context, "video_seconds_analyzed", probe.duration, asJson({
      contentAnalysisProvider: analysisProvider.name,
      contentAnalysisModel: analysisProvider.model ?? null,
      contentAnalysisRouting: analysisProvider.routing ?? null,
    })),
    recordUsage(context, "ai_transcription_seconds", probe.hasAudio ? probe.duration : 0, asJson({
      model: transcriptionProvider.model ?? null,
      provider: transcriptionProvider.name,
      routing: transcriptionProvider.routing ?? null,
    })),
    recordUsage(context, "ai_analysis_request", 1, asJson({
      model: analysisProvider.model ?? null,
      provider: analysisProvider.name,
      routing: analysisProvider.routing ?? null,
    })),
  ]);
  await context.report("Analysis complete", 100);
  return asJson({
    analysis,
    durationSeconds: probe.duration,
    providers: {
      contentAnalysis: analysisProvider.name,
      contentAnalysisModel: analysisProvider.model ?? null,
      contentAnalysisRouting: analysisProvider.routing ?? null,
      transcription: transcriptionProvider.name,
      transcriptionModel: transcriptionProvider.model ?? null,
      transcriptionRouting: transcriptionProvider.routing ?? null,
    },
    transcriptSegments: transcript.segments.length,
  });
}

async function exportVideo(context: PipelineContext) {
  const settings = editSettingsSchema.parse(context.project.edit_settings);
  const transcript = (context.project.transcript ?? emptyTranscript) as unknown as Transcript;
  const analysis = (context.project.analysis ?? emptyAnalysis) as unknown as VideoAnalysis;
  const sourcePath = join(context.tempDir, "source-video");
  const outputPath = join(context.tempDir, "export.mp4");
  const captionsPath = join(context.tempDir, "captions.srt");

  await context.report("Downloading source video", 5);
  await downloadStorageObject({
    bucket: VIDEO_SOURCE_BUCKET,
    destination: sourcePath,
    objectPath: context.project.source_path,
    supabase: context.supabase,
  });
  await context.report("Preparing export", 12);
  const probe = await probeMedia(sourcePath);
  const keepRanges = buildKeepRanges(settings, analysis, probe.duration);
  const retimedTranscript = retimeTranscript(transcript, keepRanges);
  const shouldRenderCaptions = settings.captions.enabled && retimedTranscript.segments.length > 0;
  if (shouldRenderCaptions) await writeCaptionsFile(captionsPath, retimedTranscript);

  const plan = buildExportPlan({
    analysis,
    captionsPath: shouldRenderCaptions ? captionsPath : null,
    duration: probe.duration,
    hasAudio: probe.hasAudio,
    inputPath: sourcePath,
    outputPath,
    settings,
  });
  await context.report("Rendering MP4", 18);
  let lastRenderedProgress = -1;
  await renderExport(plan, (fraction) => {
    const progress = Math.round(18 + fraction * 67);
    if (progress <= lastRenderedProgress) return;
    lastRenderedProgress = progress;
    void context.report("Rendering MP4", progress);
  });

  const outputObjectPath = `${context.project.user_id}/${context.project.id}/exports/${context.job.id}.mp4`;
  await context.report("Uploading finished video", 87);
  await uploadLargeObjectResumably({
    bucket: VIDEO_OUTPUT_BUCKET,
    config: context.config,
    contentType: "video/mp4",
    filePath: outputPath,
    objectPath: outputObjectPath,
    onProgress(fraction) {
      void context.report("Uploading finished video", Math.round(87 + fraction * 11));
    },
  });
  const outputStat = await stat(outputPath);
  await updateProject(context.supabase, context.project.id, {
    export_path: outputObjectPath,
    last_error: null,
    status: "completed",
  });
  await recordUsage(context, "video_seconds_exported", plan.outputDuration, asJson({
    bytes: outputStat.size,
    format: settings.aspectRatio,
  }));
  await context.report("Export complete", 100);
  return asJson({
    bytes: outputStat.size,
    durationSeconds: plan.outputDuration,
    objectPath: outputObjectPath,
  });
}

export async function runPipeline(context: PipelineContext) {
  return context.job.kind === "analyze" ? analyzeVideo(context) : exportVideo(context);
}
