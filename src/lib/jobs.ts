import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { performanceCreativeAgentSupportsSource } from "@/lib/domain/ai-models";
import type { GenerationRequest } from "@/lib/domain/generation";
import { HttpError } from "@/lib/http";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database.generated";

export async function consumeRateLimit(
  supabase: SupabaseClient<Database>,
  scope: string,
  requestLimit: number,
  windowSeconds: number,
) {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    request_limit: requestLimit,
    scope_name: scope,
    window_seconds: windowSeconds,
  });

  if (error) {
    throw new HttpError(503, "Rate-limit service is unavailable.", "RATE_LIMIT_UNAVAILABLE");
  }
  if (!data) {
    throw new HttpError(429, "Too many requests. Please try again shortly.", "RATE_LIMITED");
  }
}

async function requireActiveAccount(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", userId)
    .maybeSingle();
  if (error || data?.account_status !== "active") {
    throw new HttpError(403, "Reactivate this account before starting new work.", "ACCOUNT_INACTIVE");
  }
}

export async function enqueueProjectJob({
  kind,
  projectId,
  requestId,
  supabase,
  user,
}: {
  kind: "analyze" | "export";
  projectId: string;
  requestId: string;
  supabase: SupabaseClient<Database>;
  user: User;
}) {
  await requireActiveAccount(supabase, user.id);
  await consumeRateLimit(supabase, `job:${kind}`, kind === "export" ? 8 : 12, 60);

  const [{ data: project, error: projectError }, { data: activeJob }] = await Promise.all([
    supabase
      .from("projects")
      .select("id,status,source_path,source_size_bytes,duration_seconds")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select("id,status")
      .eq("project_id", projectId)
      .eq("kind", kind)
      .in("status", ["queued", "processing", "retrying"])
      .limit(1)
      .maybeSingle(),
  ]);

  if (projectError || !project) {
    throw new HttpError(404, "Project not found.", "PROJECT_NOT_FOUND");
  }
  if (activeJob) {
    throw new HttpError(409, "A matching job is already active.", "JOB_ALREADY_ACTIVE");
  }
  if (kind === "export" && !["ready", "completed", "failed"].includes(project.status)) {
    throw new HttpError(409, "Analyze the video before exporting it.", "PROJECT_NOT_READY");
  }

  if (kind === "analyze" && project.status === "uploading") {
    const pathParts = project.source_path.split("/");
    const fileName = pathParts.at(-1)!;
    const folder = pathParts.slice(0, -1).join("/");
    const { data: files, error: storageError } = await supabase.storage
      .from("video-sources")
      .list(folder, { limit: 10, search: fileName });

    if (storageError || !files?.some((file) => file.name === fileName)) {
      throw new HttpError(409, "The resumable upload has not finished.", "UPLOAD_INCOMPLETE");
    }

    const { error: uploadUpdateError } = await supabase
      .from("projects")
      .update({ status: "uploaded" })
      .eq("id", projectId);
    if (uploadUpdateError) {
      throw new HttpError(500, "Unable to confirm the upload.", "UPLOAD_CONFIRM_FAILED");
    }

    const admin = createAdminClient();
    await admin.from("usage_events").insert({
      event_type: "upload_bytes",
      metadata: { requestId },
      project_id: projectId,
      units: project.source_size_bytes,
      user_id: user.id,
    });
  }

  const payload: Json = { requestId };
  const admin = createAdminClient();
  const { data: job, error: insertError } = await admin
    .from("jobs")
    .insert({
      kind,
      payload,
      project_id: projectId,
      stage: "Waiting for a worker",
      status: "queued",
      user_id: user.id,
    })
    .select("*")
    .single();

  if (insertError || !job) {
    if (insertError?.code === "23505") {
      throw new HttpError(409, "A matching job is already active.", "JOB_ALREADY_ACTIVE");
    }
    throw new HttpError(500, "Unable to create the processing job.", "JOB_CREATE_FAILED");
  }

  const queueMessage: Json = {
    jobId: job.id,
    kind,
    projectId,
    userId: user.id,
  };
  const { data: queueMessageId, error: queueError } = await admin.rpc("queue_video_job", {
    message: queueMessage,
  });

  if (queueError || queueMessageId === null) {
    await admin
      .from("jobs")
      .update({
        error_code: "QUEUE_SUBMIT_FAILED",
        error_message: "The job could not be added to the durable queue.",
        finished_at: new Date().toISOString(),
        stage: "Queue submission failed",
        status: "failed",
      })
      .eq("id", job.id);
    logger.error({ err: queueError, jobId: job.id, requestId }, "Queue submission failed");
    throw new HttpError(503, "Processing queue is unavailable.", "QUEUE_UNAVAILABLE");
  }

  const projectStatus = kind === "analyze" ? "analyzing" : "exporting";
  await Promise.all([
    supabase
      .from("jobs")
      .update({ queue_message_id: queueMessageId })
      .eq("id", job.id),
    supabase
      .from("projects")
      .update({ last_error: null, status: projectStatus })
      .eq("id", projectId),
  ]);

  logger.info(
    { jobId: job.id, kind, projectId, queueMessageId, requestId, userId: user.id },
    "Video job queued",
  );

  return { ...job, queue_message_id: queueMessageId };
}

export async function enqueueGenerationJob({
  input,
  requestId,
  supabase,
  user,
}: {
  input: GenerationRequest;
  requestId: string;
  supabase: SupabaseClient<Database>;
  user: User;
}) {
  await requireActiveAccount(supabase, user.id);
  await consumeRateLimit(
    supabase,
    `generation:${input.kind}`,
    input.kind === "video" || input.kind === "performance_creative" ? 2 : 8,
    60,
  );

  if (input.kind === "background_removal") {
    if (!input.sourcePath.startsWith(`${user.id}/`)) {
      throw new HttpError(403, "The source image does not belong to this account.", "SOURCE_FORBIDDEN");
    }
    const sourceParts = input.sourcePath.split("/");
    const sourceName = sourceParts.pop();
    const sourceFolder = sourceParts.join("/");
    const { data: sourceFiles, error: sourceError } = await supabase.storage
      .from(input.sourceBucket)
      .list(sourceFolder, { limit: 5, search: sourceName });
    if (sourceError || !sourceName || !sourceFiles?.some((file) => file.name === sourceName)) {
      throw new HttpError(409, "Upload the source image before starting removal.", "SOURCE_NOT_READY");
    }
  }

  if (input.kind === "performance_creative") {
    if (!performanceCreativeAgentSupportsSource(input.agentId, input.source.type)) {
      throw new HttpError(400, "That creative agent does not support the selected source.", "AGENT_SOURCE_MISMATCH");
    }
    if (input.source.type === "product_url" && input.duration !== "8s") {
      throw new HttpError(400, "Product URL ads currently support the 8-second generated format.", "DURATION_UNSUPPORTED");
    }
    if (input.source.type === "long_video" && input.duration === "8s") {
      throw new HttpError(400, "Long-video creatives support 15- or 30-second cuts.", "DURATION_UNSUPPORTED");
    }
    if (input.source.type === "long_video") {
      const { data: sourceProject, error: sourceProjectError } = await supabase
        .from("projects")
        .select("id,status,source_path,duration_seconds")
        .eq("id", input.source.projectId)
        .maybeSingle();
      if (sourceProjectError || !sourceProject) {
        throw new HttpError(404, "The selected source video was not found.", "SOURCE_NOT_FOUND");
      }
      if (!["ready", "completed"].includes(sourceProject.status) || !sourceProject.duration_seconds) {
        throw new HttpError(409, "Finish analyzing the long video before creating ad clips.", "SOURCE_NOT_READY");
      }
      if (!sourceProject.source_path.startsWith(`${user.id}/`)) {
        throw new HttpError(403, "The selected source video does not belong to this account.", "SOURCE_FORBIDDEN");
      }
    }
  }

  const admin = createAdminClient();
  const { data: generation, error: generationError } = await admin
    .from("generations")
    .insert({
      kind: input.kind,
      name: input.name,
      prompt: input.prompt,
      routing_profile: input.profile,
      settings: input as unknown as Json,
      status: "queued",
      user_id: user.id,
    })
    .select("*")
    .single();

  if (generationError || !generation) {
    throw new HttpError(500, "Unable to create the generation.", "GENERATION_CREATE_FAILED");
  }

  const kind = input.kind === "image"
    ? "generate_image"
    : input.kind === "video"
      ? "generate_video"
      : input.kind === "background_removal"
        ? "generate_background_removal"
        : "generate_performance_creative";
  const { data: job, error: jobError } = await admin
    .from("jobs")
    .insert({
      generation_id: generation.id,
      kind,
      payload: { ...input, requestId } as unknown as Json,
      stage: input.kind === "background_removal"
        ? "Cutout agent is preparing"
        : input.kind === "performance_creative"
          ? "Performance creative agent is preparing"
          : "Model Autopilot is preparing",
      status: "queued",
      user_id: user.id,
    })
    .select("*")
    .single();

  if (jobError || !job) {
    await admin.from("generations").delete().eq("id", generation.id);
    throw new HttpError(500, "Unable to create the generation job.", "JOB_CREATE_FAILED");
  }

  const queueMessage: Json = {
    generationId: generation.id,
    jobId: job.id,
    kind,
    userId: user.id,
  };
  const { data: queueMessageId, error: queueError } = await admin.rpc("queue_video_job", {
    message: queueMessage,
  });

  if (queueError || queueMessageId === null) {
    const finishedAt = new Date().toISOString();
    await Promise.all([
      admin
        .from("jobs")
        .update({
          error_code: "QUEUE_SUBMIT_FAILED",
          error_message: "The generation could not be added to the durable queue.",
          finished_at: finishedAt,
          stage: "Queue submission failed",
          status: "failed",
        })
        .eq("id", job.id),
      admin
        .from("generations")
        .update({ last_error: "The generation could not be queued.", status: "failed" })
        .eq("id", generation.id),
    ]);
    logger.error({ err: queueError, generationId: generation.id, jobId: job.id, requestId }, "Generation queue submission failed");
    throw new HttpError(503, "Processing queue is unavailable.", "QUEUE_UNAVAILABLE");
  }

  await admin
    .from("jobs")
    .update({ queue_message_id: queueMessageId })
    .eq("id", job.id);

  logger.info(
    { generationId: generation.id, jobId: job.id, kind, queueMessageId, requestId, userId: user.id },
    "Generation queued",
  );

  return {
    generation,
    job: { ...job, queue_message_id: queueMessageId },
  };
}
