import { createWriteStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildGenerationPrompt,
  generationJobPayloadSchema,
  type GenerationJobPayload,
} from "../src/lib/domain/generation";
import { endpointForAgent } from "../src/lib/domain/ai-models";
import { VIDEO_ASSET_BUCKET, VIDEO_OUTPUT_BUCKET } from "../src/lib/domain/video";
import type { Database, Json, Tables } from "../src/types/database.generated";
import type { WorkerConfig } from "./config";
import { createWorkerFalClient } from "./providers/fal/client";
import { resolveFalModel } from "./providers/fal/routing";
import { uploadLargeObjectResumably, uploadSmallObject } from "./storage";
import type { ProgressReporter } from "./pipeline";

type Generation = Tables<"generations">;
type Job = Tables<"jobs">;

type GenerationContext = {
  config: WorkerConfig;
  generation: Generation;
  job: Job;
  report: ProgressReporter;
  supabase: SupabaseClient<Database>;
  tempDir: string;
};

const imageResultSchema = z.object({
  images: z.array(z.object({
    content_type: z.string().optional(),
    height: z.number().int().positive().optional(),
    url: z.string().url(),
    width: z.number().int().positive().optional(),
  })).min(1),
  seed: z.number().int().optional(),
});

const videoResultSchema = z.object({
  video: z.object({
    content_type: z.string().optional(),
    url: z.string().url(),
  }),
});

const backgroundResultSchema = z.object({
  image: z.object({
    content_type: z.string().optional(),
    height: z.number().int().positive().optional(),
    url: z.string().url(),
    width: z.number().int().positive().optional(),
  }),
});

const videoDeliveryCheckpointSchema = z.object({
  checkpoint: z.object({
    contentType: z.string().optional(),
    createdAt: z.string().datetime(),
    kind: z.literal("generate_video"),
    mediaUrl: z.string().url(),
    modelEndpoint: z.string().min(1),
    provider: z.literal("fal"),
  }),
});

function asJson(value: unknown) {
  return value as Json;
}

function allowedMediaUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const allowedHost = url.hostname === "storage.googleapis.com" || url.hostname.endsWith(".fal.media");
  if (url.protocol !== "https:" || !allowedHost) {
    throw new Error("The generation provider returned an untrusted media URL.");
  }
  return url;
}

async function downloadProviderMedia({
  destination,
  maxBytes,
  url,
}: {
  destination: string;
  maxBytes: number;
  url: string;
}) {
  const response = await fetch(allowedMediaUrl(url), {
    signal: AbortSignal.timeout(30 * 60 * 1000),
  });
  if (!response.ok || !response.body) {
    throw new Error(`Generation download returned ${response.status}.`);
  }
  const announcedSize = Number(response.headers.get("content-length") ?? 0);
  if (announcedSize > maxBytes) throw new Error("Generated media exceeded the storage limit.");

  let received = 0;
  const limiter = new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length;
      callback(received > maxBytes ? new Error("Generated media exceeded the storage limit.") : null, chunk);
    },
  });
  await pipeline(
    Readable.fromWeb(response.body as never),
    limiter,
    createWriteStream(destination, { flags: "wx" }),
  );
  return response.headers.get("content-type")?.split(";")[0] ?? null;
}

async function updateGeneration(
  context: GenerationContext,
  values: Database["public"]["Tables"]["generations"]["Update"],
) {
  const { error } = await context.supabase
    .from("generations")
    .update(values)
    .eq("id", context.generation.id);
  if (error) throw new Error(`Unable to update generation: ${error.message}`);
}

async function saveVideoDeliveryCheckpoint(
  context: GenerationContext,
  checkpoint: z.infer<typeof videoDeliveryCheckpointSchema>["checkpoint"],
) {
  const { error } = await context.supabase
    .from("jobs")
    .update({ result: asJson({ checkpoint }) })
    .eq("id", context.job.id);
  if (error) throw new Error(`Unable to checkpoint generated video: ${error.message}`);
}

async function recordGenerationUsage(
  context: GenerationContext,
  eventType: "ai_image_generation" | "ai_video_generation" | "background_removal",
  units: number,
  metadata: Json,
) {
  const { error } = await context.supabase.from("usage_events").insert({
    event_type: eventType,
    generation_id: context.generation.id,
    job_id: context.job.id,
    metadata,
    units,
    user_id: context.generation.user_id,
  });
  if (error) throw new Error(`Unable to record generation usage: ${error.message}`);
}

function imageInput(payload: Extract<GenerationJobPayload, { kind: "image" }>, endpointId: string) {
  const base = {
    enable_safety_checker: true,
    image_size: payload.aspectRatio,
    prompt: buildGenerationPrompt(payload),
    ...(payload.seed === undefined ? {} : { seed: payload.seed }),
  };
  if (endpointId === "fal-ai/flux-2-max") {
    return { ...base, output_format: "jpeg", safety_tolerance: "2" };
  }
  return {
    ...base,
    enable_prompt_expansion: true,
    num_images: 1,
    output_format: "png",
  };
}

async function generateImage(context: GenerationContext, payload: Extract<GenerationJobPayload, { kind: "image" }>) {
  const routing = resolveFalModel({
    capability: "text-to-image",
    overrides: context.config.FAL_MODEL_OVERRIDES,
    preferredEndpointId: endpointForAgent("image", payload.agentId),
    profile: payload.profile,
  });
  await updateGeneration(context, {
    model_endpoint: routing.endpointId,
    routing_profile: routing.profile,
    routing_reason: routing.reason,
    status: "processing",
  });
  await context.report(`Model Autopilot selected ${routing.endpointId}`, 18);

  const client = createWorkerFalClient(context.config.FAL_KEY);
  const response = await client.subscribe(routing.endpointId, {
    input: imageInput(payload, routing.endpointId),
    logs: false,
  });
  const result = imageResultSchema.parse(response.data);
  const image = result.images[0];
  const providerMime = image.content_type?.split(";")[0];
  const extension = providerMime === "image/jpeg" ? "jpg" : providerMime === "image/webp" ? "webp" : "png";
  const filePath = join(context.tempDir, `generated.${extension}`);
  await context.report("Securing generated image", 72);
  const downloadedMime = await downloadProviderMedia({ destination: filePath, maxBytes: 40 * 1024 * 1024, url: image.url });
  const outputMime = providerMime ?? downloadedMime ?? (extension === "jpg" ? "image/jpeg" : `image/${extension}`);
  const outputPath = `${context.generation.user_id}/${context.generation.id}/${context.job.id}-${context.job.attempt}.${extension}`;
  await context.report("Saving private high-resolution result", 86);
  await uploadSmallObject({
    bucket: VIDEO_ASSET_BUCKET,
    contentType: outputMime,
    filePath,
    objectPath: outputPath,
    supabase: context.supabase,
  });
  await updateGeneration(context, {
    height: image.height ?? null,
    last_error: null,
    output_bucket: VIDEO_ASSET_BUCKET,
    output_mime: outputMime,
    output_path: outputPath,
    seed: result.seed ?? payload.seed ?? null,
    status: "completed",
    width: image.width ?? null,
  });
  await recordGenerationUsage(context, "ai_image_generation", 1, asJson({ routing, style: payload.style }));
  await context.report("Image ready", 100);
  return asJson({
    objectPath: outputPath,
    routing,
    seed: result.seed ?? payload.seed ?? null,
  });
}

async function generateVideo(context: GenerationContext, payload: Extract<GenerationJobPayload, { kind: "video" }>) {
  const selectedRouting = resolveFalModel({
    capability: "text-to-video",
    overrides: context.config.FAL_MODEL_OVERRIDES,
    preferredEndpointId: endpointForAgent("video", payload.agentId),
    profile: payload.profile,
  });
  const checkpointResult = videoDeliveryCheckpointSchema.safeParse(context.job.result);
  const checkpoint = checkpointResult.success ? checkpointResult.data.checkpoint : null;
  const routing = checkpoint
    ? {
        ...selectedRouting,
        endpointId: checkpoint.modelEndpoint,
        reason: `Resuming the existing ${checkpoint.modelEndpoint} provider result without another paid generation.`,
      }
    : selectedRouting;
  await updateGeneration(context, {
    model_endpoint: routing.endpointId,
    routing_profile: routing.profile,
    routing_reason: routing.reason,
    status: "processing",
  });
  await context.report(`Model Autopilot selected ${routing.endpointId}`, 14);

  let providerVideo: { contentType?: string; mediaUrl: string };
  if (checkpoint) {
    providerVideo = { contentType: checkpoint.contentType, mediaUrl: checkpoint.mediaUrl };
    await context.report("Resuming secure delivery of the existing video", 68);
  } else {
    const client = createWorkerFalClient(context.config.FAL_KEY);
    const response = await client.subscribe(routing.endpointId, {
      input: {
        aspect_ratio: payload.aspectRatio,
        auto_fix: true,
        duration: payload.duration,
        generate_audio: payload.generateAudio,
        prompt: buildGenerationPrompt(payload),
        resolution: payload.resolution,
        safety_tolerance: "2",
        ...(payload.seed === undefined ? {} : { seed: payload.seed }),
      },
      logs: false,
    });
    const result = videoResultSchema.parse(response.data);
    providerVideo = { contentType: result.video.content_type, mediaUrl: result.video.url };
    await saveVideoDeliveryCheckpoint(context, {
      contentType: providerVideo.contentType,
      createdAt: new Date().toISOString(),
      kind: "generate_video",
      mediaUrl: providerVideo.mediaUrl,
      modelEndpoint: routing.endpointId,
      provider: "fal",
    });
  }
  const filePath = join(context.tempDir, "generated.mp4");
  await context.report("Securing generated video", 72);
  const downloadedMime = await downloadProviderMedia({ destination: filePath, maxBytes: 1024 * 1024 * 1024, url: providerVideo.mediaUrl });
  const outputMime = providerVideo.contentType?.split(";")[0] ?? downloadedMime ?? "video/mp4";
  const outputPath = `${context.generation.user_id}/${context.generation.id}/${context.job.id}-${context.job.attempt}.mp4`;
  await context.report("Uploading private master", 84);
  await uploadLargeObjectResumably({
    bucket: VIDEO_OUTPUT_BUCKET,
    config: context.config,
    contentType: outputMime,
    filePath,
    objectPath: outputPath,
    onProgress(fraction) {
      void context.report("Uploading private master", Math.round(84 + fraction * 14));
    },
  });
  const fileStat = await stat(filePath);
  const durationSeconds = Number.parseInt(payload.duration, 10);
  const landscape = payload.aspectRatio === "16:9";
  const longEdge = payload.resolution === "1080p" ? 1920 : 1280;
  const shortEdge = payload.resolution === "1080p" ? 1080 : 720;
  await updateGeneration(context, {
    duration_seconds: durationSeconds,
    height: landscape ? shortEdge : longEdge,
    last_error: null,
    output_bucket: VIDEO_OUTPUT_BUCKET,
    output_mime: outputMime,
    output_path: outputPath,
    seed: payload.seed ?? null,
    status: "completed",
    width: landscape ? longEdge : shortEdge,
  });
  await recordGenerationUsage(context, "ai_video_generation", durationSeconds, asJson({
    bytes: fileStat.size,
    generateAudio: payload.generateAudio,
    routing,
  }));
  await context.report("Video ready", 100);
  return asJson({ bytes: fileStat.size, durationSeconds, objectPath: outputPath, routing });
}

async function removeBackground(
  context: GenerationContext,
  payload: Extract<GenerationJobPayload, { kind: "background_removal" }>,
) {
  const expectedPrefix = `${context.generation.user_id}/`;
  if (!payload.sourcePath.startsWith(expectedPrefix)) {
    throw new Error("Background-removal source does not belong to the generation owner.");
  }

  const routing = resolveFalModel({
    capability: "background-removal",
    overrides: context.config.FAL_MODEL_OVERRIDES,
    preferredEndpointId: endpointForAgent("background_removal", payload.agentId),
    profile: payload.profile,
  });
  await updateGeneration(context, {
    model_endpoint: routing.endpointId,
    routing_profile: routing.profile,
    routing_reason: routing.reason,
    status: "processing",
  });
  await context.report(`Cutout agent selected ${routing.endpointId}`, 18);

  const { data: signedSource, error: signingError } = await context.supabase.storage
    .from(payload.sourceBucket)
    .createSignedUrl(payload.sourcePath, 60 * 60);
  if (signingError || !signedSource) {
    throw new Error(`Unable to securely open the source image: ${signingError?.message ?? "unknown error"}`);
  }

  const client = createWorkerFalClient(context.config.FAL_KEY);
  const response = await client.subscribe(routing.endpointId, {
    input: routing.endpointId === "fal-ai/birefnet/v2"
      ? {
          image_url: signedSource.signedUrl,
          model: "General Use (Dynamic)",
          operating_resolution: "2048x2048",
          output_format: "png",
          refine_foreground: true,
        }
      : {
          crop_to_bbox: false,
          image_url: signedSource.signedUrl,
        },
    logs: false,
  });
  const result = backgroundResultSchema.parse(response.data);
  const filePath = join(context.tempDir, "background-removed.png");
  await context.report("Refining transparent edges", 68);
  const downloadedMime = await downloadProviderMedia({
    destination: filePath,
    maxBytes: 40 * 1024 * 1024,
    url: result.image.url,
  });
  const outputMime = result.image.content_type?.split(";")[0] ?? downloadedMime ?? "image/png";
  const outputPath = `${context.generation.user_id}/${context.generation.id}/${context.job.id}-${context.job.attempt}.png`;
  await context.report("Saving private transparent PNG", 86);
  await uploadSmallObject({
    bucket: VIDEO_ASSET_BUCKET,
    contentType: outputMime,
    filePath,
    objectPath: outputPath,
    supabase: context.supabase,
  });
  await updateGeneration(context, {
    height: result.image.height ?? null,
    last_error: null,
    output_bucket: VIDEO_ASSET_BUCKET,
    output_mime: outputMime,
    output_path: outputPath,
    status: "completed",
    width: result.image.width ?? null,
  });
  await recordGenerationUsage(context, "background_removal", 1, asJson({ routing }));
  const { error: cleanupError } = await context.supabase.storage
    .from(payload.sourceBucket)
    .remove([payload.sourcePath]);
  if (cleanupError) {
    await context.report("Cutout ready; source cleanup will be retried later", 98);
  }
  await context.report("Transparent image ready", 100);
  return asJson({ objectPath: outputPath, routing });
}

export async function runGenerationPipeline(context: GenerationContext) {
  const payload = generationJobPayloadSchema.parse(context.job.payload);
  if (payload.kind !== context.generation.kind) {
    throw new Error("Generation job kind does not match its generation record.");
  }
  if (payload.kind === "image") return generateImage(context, payload);
  if (payload.kind === "video") return generateVideo(context, payload);
  return removeBackground(context, payload);
}
