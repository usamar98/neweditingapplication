import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { editorAgentIdSchema, performanceCreativeAgentSupportsSource } from "@/lib/domain/ai-models";
import type { GenerationRequest } from "@/lib/domain/generation";
import {
  billingMetadataForQuote,
  failUnstartedJob,
  quoteGenerationCredits,
  quoteProjectCredits,
  requireActiveSubscription,
  requireGenerationAccess,
  reserveCredits,
} from "@/lib/credits";
import { clipSourceUrlSchema, MAX_CLIP_SOURCE_SECONDS } from "@/lib/domain/video";
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
  agentId,
  kind,
  projectId,
  requestId,
  sourceUrl,
  supabase,
  user,
}: {
  agentId?: string;
  kind: "analyze" | "export";
  projectId: string;
  requestId: string;
  sourceUrl?: string;
  supabase: SupabaseClient<Database>;
  user: User;
}) {
  const selectedEditorAgent = kind === "analyze" ? editorAgentIdSchema.parse(agentId ?? "auto") : undefined;
  const validatedSourceUrl = sourceUrl ? clipSourceUrlSchema.parse(sourceUrl) : undefined;
  await requireActiveAccount(supabase, user.id);
  await consumeRateLimit(supabase, `job:${kind}`, kind === "export" ? 8 : 12, 60);
  const admin = createAdminClient();
  await requireActiveSubscription(admin, user.id);

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

  if (kind === "analyze" && project.status === "uploading" && !validatedSourceUrl) {
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

    await admin.from("usage_events").insert({
      event_type: "upload_bytes",
      metadata: { requestId },
      project_id: projectId,
      units: project.source_size_bytes,
      user_id: user.id,
    });
  }

  const creditQuote = quoteProjectCredits({
    agentId: selectedEditorAgent,
    durationSeconds: validatedSourceUrl
      ? MAX_CLIP_SOURCE_SECONDS
      : Number(project.duration_seconds ?? 60),
    kind,
  });
  const payload: Json = {
    billing: billingMetadataForQuote(creditQuote),
    requestId,
    ...(selectedEditorAgent ? { agentId: selectedEditorAgent } : {}),
    ...(validatedSourceUrl ? { sourceUrl: validatedSourceUrl } : {}),
  };
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

  let reservation;
  try {
    reservation = await reserveCredits(admin, {
      jobId: job.id,
      quote: creditQuote,
      requestId,
      userId: user.id,
    });
  } catch (error) {
    await failUnstartedJob(
      admin,
      job.id,
      "CREDIT_RESERVATION_FAILED",
      "The job could not reserve subscription credits.",
      "Credit reservation failed",
    ).catch((releaseError) => {
      logger.error({ err: releaseError, jobId: job.id, requestId }, "Unable to reconcile failed credit reservation");
    });
    throw error;
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
    await failUnstartedJob(
      admin,
      job.id,
      "QUEUE_SUBMIT_FAILED",
      "The job could not be added to the durable queue.",
      "Queue submission failed",
    );
    logger.error({ err: queueError, jobId: job.id, requestId }, "Queue submission failed");
    throw new HttpError(503, "Processing queue is unavailable.", "QUEUE_UNAVAILABLE");
  }

  const projectStatus = kind === "analyze" ? "analyzing" : "exporting";
  const [{ error: queueReferenceError }, { error: projectStatusError }] = await Promise.all([
    admin
      .from("jobs")
      .update({ queue_message_id: queueMessageId })
      .eq("id", job.id),
    admin
      .from("projects")
      .update({ last_error: null, status: projectStatus })
      .eq("id", projectId),
  ]);
  if (queueReferenceError || projectStatusError) {
    logger.error(
      {
        jobId: job.id,
        projectId,
        projectStatusError: projectStatusError?.message,
        queueMessageId,
        queueReferenceError: queueReferenceError?.message,
        requestId,
      },
      "Video job queued but its database references were not fully updated",
    );
  }

  logger.info(
    { jobId: job.id, kind, projectId, queueMessageId, requestId, userId: user.id },
    "Video job queued",
  );

  return { ...job, credit: { quote: creditQuote, reservation }, queue_message_id: queueMessageId };
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
    input.kind === "video" || input.kind === "image_to_video" || input.kind === "performance_creative" ? 2 : 8,
    60,
  );
  const admin = createAdminClient();
  const accessMode = await requireGenerationAccess(admin, user.id);
  const effectiveInput = input;

  if (effectiveInput.kind === "background_removal") {
    if (!effectiveInput.sourcePath.startsWith(`${user.id}/`)) {
      throw new HttpError(403, "The source image does not belong to this account.", "SOURCE_FORBIDDEN");
    }
    const sourceParts = effectiveInput.sourcePath.split("/");
    const sourceName = sourceParts.pop();
    const sourceFolder = sourceParts.join("/");
    const { data: sourceFiles, error: sourceError } = await supabase.storage
      .from(effectiveInput.sourceBucket)
      .list(sourceFolder, { limit: 5, search: sourceName });
    if (sourceError || !sourceName || !sourceFiles?.some((file) => file.name === sourceName)) {
      throw new HttpError(409, "Upload the source image before starting removal.", "SOURCE_NOT_READY");
    }
  }


  if (effectiveInput.kind === "image_to_video") {
    const sourcePaths = [effectiveInput.sourcePath, effectiveInput.endSourcePath].filter(
      (value): value is string => Boolean(value),
    );
    for (const sourcePath of sourcePaths) {
      if (!sourcePath.startsWith(`${user.id}/image-to-video/`)) {
        throw new HttpError(403, "The source image does not belong to this account.", "SOURCE_FORBIDDEN");
      }
      const sourceParts = sourcePath.split("/");
      const sourceName = sourceParts.pop();
      const sourceFolder = sourceParts.join("/");
      const { data: sourceFiles, error: sourceError } = await supabase.storage
        .from(effectiveInput.sourceBucket)
        .list(sourceFolder, { limit: 5, search: sourceName });
      if (sourceError || !sourceName || !sourceFiles?.some((file) => file.name === sourceName)) {
        throw new HttpError(409, "Upload each source frame before starting animation.", "SOURCE_NOT_READY");
      }
    }
  }

  let sourceDurationSeconds: number | null = null;
  if (effectiveInput.kind === "performance_creative") {
    if (!performanceCreativeAgentSupportsSource(effectiveInput.agentId, effectiveInput.source.type, effectiveInput.outputType)) {
      throw new HttpError(400, "That creative agent does not support the selected source and ad format.", "AGENT_SOURCE_MISMATCH");
    }
    if (effectiveInput.source.type === "business_brief" && effectiveInput.outputType !== "image") {
      throw new HttpError(400, "Business briefs currently create platform-ready image ads.", "FORMAT_UNSUPPORTED");
    }
    if (effectiveInput.source.type === "long_video" && effectiveInput.outputType !== "video") {
      throw new HttpError(400, "Long-video sources currently create short-form video ads.", "FORMAT_UNSUPPORTED");
    }
    if (effectiveInput.outputType === "video" && effectiveInput.source.type === "product_url" && effectiveInput.duration !== "8s") {
      throw new HttpError(400, "Product URL ads currently support the 8-second generated format.", "DURATION_UNSUPPORTED");
    }
    if (effectiveInput.outputType === "video" && effectiveInput.source.type === "long_video" && effectiveInput.duration === "8s") {
      throw new HttpError(400, "Long-video creatives support 15- or 30-second cuts.", "DURATION_UNSUPPORTED");
    }
    if (effectiveInput.source.type === "long_video") {
      const { data: sourceProject, error: sourceProjectError } = await supabase
        .from("projects")
        .select("id,status,source_path,duration_seconds")
        .eq("id", effectiveInput.source.projectId)
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
      sourceDurationSeconds = Number(sourceProject.duration_seconds);
    }
  }

  const creditQuote = quoteGenerationCredits(effectiveInput, sourceDurationSeconds);
  const { data: generation, error: generationError } = await admin
    .from("generations")
    .insert({
      kind: effectiveInput.kind,
      name: effectiveInput.name,
      prompt: effectiveInput.prompt,
      routing_profile: effectiveInput.profile,
      settings: effectiveInput as unknown as Json,
      status: "queued",
      user_id: user.id,
    })
    .select("*")
    .single();

  if (generationError || !generation) {
    throw new HttpError(500, "Unable to create the generation.", "GENERATION_CREATE_FAILED");
  }

  const kind = effectiveInput.kind === "image"
    ? "generate_image"
    : effectiveInput.kind === "video"
      ? "generate_video"
      : effectiveInput.kind === "image_to_video"
        ? "generate_image_to_video"
      : effectiveInput.kind === "background_removal"
        ? "generate_background_removal"
        : "generate_performance_creative";
  const { data: job, error: jobError } = await admin
    .from("jobs")
    .insert({
      generation_id: generation.id,
      kind,
      payload: {
        ...effectiveInput,
        billing: billingMetadataForQuote(creditQuote),
        requestId,
      } as unknown as Json,
      stage: effectiveInput.kind === "background_removal"
        ? "Cutout agent is preparing"
        : effectiveInput.kind === "image_to_video"
          ? "Motion director is preparing"
        : effectiveInput.kind === "performance_creative"
          ? effectiveInput.outputType === "image"
            ? "AI image ad designer is preparing"
            : "AI video ad director is preparing"
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

  let reservation;
  try {
    reservation = await reserveCredits(admin, {
      jobId: job.id,
      quote: creditQuote,
      requestId,
      userId: user.id,
    });
  } catch (error) {
    await Promise.all([
      failUnstartedJob(
        admin,
        job.id,
        "CREDIT_RESERVATION_FAILED",
        "The generation could not reserve subscription credits.",
        "Credit reservation failed",
      ).catch((releaseError) => {
        logger.error({ err: releaseError, generationId: generation.id, jobId: job.id, requestId }, "Unable to reconcile failed generation credit reservation");
      }),
      admin
        .from("generations")
        .update({ last_error: "Subscription credits could not be reserved.", status: "failed" })
        .eq("id", generation.id),
    ]);
    throw error;
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
    await failUnstartedJob(
      admin,
      job.id,
      "QUEUE_SUBMIT_FAILED",
      "The generation could not be added to the durable queue.",
      "Queue submission failed",
    );
    await admin
      .from("generations")
      .update({ last_error: "The generation could not be queued.", status: "failed" })
      .eq("id", generation.id);
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
    credit: { accessMode, quote: creditQuote, reservation },
    generation,
    job: { ...job, queue_message_id: queueMessageId },
  };
}
