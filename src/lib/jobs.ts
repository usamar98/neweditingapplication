import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
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
  await consumeRateLimit(
    supabase,
    `generation:${input.kind}`,
    input.kind === "video" ? 2 : 8,
    60,
  );

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

  const kind = input.kind === "image" ? "generate_image" : "generate_video";
  const { data: job, error: jobError } = await admin
    .from("jobs")
    .insert({
      generation_id: generation.id,
      kind,
      payload: { ...input, requestId } as unknown as Json,
      stage: "Model Autopilot is preparing",
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
