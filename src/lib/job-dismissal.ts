import "server-only";

import { z } from "zod";
import { generationRequestSchema } from "@/lib/domain/generation";
import { HttpError } from "@/lib/http";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

const dismissalResultSchema = z.object({
  action: z.enum(["cancelled", "dismissed"]),
  generationId: z.string().uuid().nullish(),
  jobId: z.string().uuid().nullish(),
  queueMessageId: z.number().int().nullish(),
});

export type DismissalResult = z.infer<typeof dismissalResultSchema>;

async function archiveCancelledQueueMessage(result: DismissalResult, requestId: string) {
  if (result.action !== "cancelled" || result.queueMessageId == null) return;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("archive_video_job", {
    message_id: result.queueMessageId,
  });
  if (error || !data) {
    logger.warn(
      { error: error?.message, jobId: result.jobId, queueMessageId: result.queueMessageId, requestId },
      "Cancelled job will be archived when the worker next receives it",
    );
  }
}

export async function dismissGenerationForUser({
  generationId,
  requestId,
  userId,
}: {
  generationId: string;
  requestId: string;
  userId: string;
}) {
  const admin = createAdminClient();
  const { data: generation } = await admin
    .from("generations")
    .select("settings")
    .eq("id", generationId)
    .eq("user_id", userId)
    .maybeSingle();
  const { data, error } = await admin.rpc("dismiss_generation_admin", {
    p_generation_id: generationId,
    p_user_id: userId,
  });
  if (error || !data) {
    logger.error({ error: error?.message, generationId, requestId, userId }, "Unable to dismiss generation");
    throw new HttpError(500, "Unable to remove this generation.", "GENERATION_DISMISS_FAILED");
  }

  const result = dismissalResultSchema.parse(data);
  await archiveCancelledQueueMessage(result, requestId);
  const settings = generationRequestSchema.safeParse(generation?.settings);
  if (settings.success && settings.data.kind === "image_to_video") {
    const sourcePaths = [settings.data.sourcePath, settings.data.endSourcePath].filter(
      (value): value is string => Boolean(value),
    );
    const { error: cleanupError } = await admin.storage
      .from(settings.data.sourceBucket)
      .remove(sourcePaths);
    if (cleanupError) {
      logger.warn(
        { error: cleanupError.message, generationId, requestId, userId },
        "Unable to remove dismissed image-to-video source frames",
      );
    }
  }
  return result;
}

export async function dismissJobForUser({
  jobId,
  requestId,
  userId,
}: {
  jobId: string;
  requestId: string;
  userId: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("dismiss_job_admin", {
    p_job_id: jobId,
    p_user_id: userId,
  });
  if (error || !data) {
    logger.error({ error: error?.message, jobId, requestId, userId }, "Unable to dismiss processing job");
    throw new HttpError(500, "Unable to remove this process.", "JOB_DISMISS_FAILED");
  }

  const result = dismissalResultSchema.parse(data);
  await archiveCancelledQueueMessage(result, requestId);
  return result;
}
