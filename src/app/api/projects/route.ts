import { createProjectSchema, VIDEO_SOURCE_BUCKET } from "@/lib/domain/video";
import { requireActiveSubscription } from "@/lib/credits";
import { errorResponse, getRequestId, HttpError } from "@/lib/http";
import { consumeRateLimit } from "@/lib/jobs";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDirectStorageUrl, isSupabaseConfigured } from "@/lib/config";

const extensionByMime = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-matroska": "mkv",
} as const;

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    if (!isSupabaseConfigured()) {
      throw new HttpError(503, "Supabase is not configured.", "NOT_CONFIGURED");
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new HttpError(401, "Sign in to upload a video.", "UNAUTHENTICATED");
    }

    await requireActiveSubscription(createAdminClient(), authData.user.id);
    const input = createProjectSchema.parse(await request.json());

    await consumeRateLimit(supabase, input.resumeProjectId ? "upload:resume" : "project:create", input.resumeProjectId ? 120 : 20, 3600);

    if (input.resumeProjectId) {
      const { data: existingProject } = await supabase
        .from("projects")
        .select("id,name,status,source_path")
        .eq("id", input.resumeProjectId)
        .eq("status", "uploading")
        .eq("source_filename", input.fileName)
        .eq("source_mime", input.mimeType)
        .eq("source_size_bytes", input.size)
        .maybeSingle();
      if (!existingProject) {
        throw new HttpError(404, "The resumable upload is no longer available.", "UPLOAD_RESUME_NOT_FOUND");
      }
      const { data: renewedUpload, error: renewError } = await supabase.storage
        .from(VIDEO_SOURCE_BUCKET)
        .createSignedUploadUrl(existingProject.source_path, { upsert: false });
      if (renewError || !renewedUpload) {
        throw new HttpError(500, "Unable to renew the upload authorization.", "UPLOAD_SIGN_FAILED");
      }
      logger.info(
        { projectId: existingProject.id, requestId, userId: authData.user.id },
        "Video upload resumed",
      );
      return Response.json({
        project: existingProject,
        upload: {
          endpoint: getDirectStorageUrl(),
          path: existingProject.source_path,
          token: renewedUpload.token,
        },
      });
    }

    const projectId = crypto.randomUUID();
    const objectId = crypto.randomUUID();
    const extension = extensionByMime[input.mimeType];
    const sourcePath = `${authData.user.id}/${projectId}/source/${objectId}.${extension}`;
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        id: projectId,
        name: input.name,
        source_filename: input.fileName,
        source_mime: input.mimeType,
        source_path: sourcePath,
        source_size_bytes: input.size,
        user_id: authData.user.id,
      })
      .select("id,name,status,source_path")
      .single();

    if (projectError || !project) {
      throw new HttpError(500, "Unable to create the video project.", "PROJECT_CREATE_FAILED");
    }

    const { data: signedUpload, error: signedUploadError } = await supabase.storage
      .from(VIDEO_SOURCE_BUCKET)
      .createSignedUploadUrl(sourcePath, { upsert: false });

    if (signedUploadError || !signedUpload) {
      await supabase.from("projects").delete().eq("id", projectId);
      throw new HttpError(500, "Unable to authorize the upload.", "UPLOAD_SIGN_FAILED");
    }

    logger.info(
      { projectId, requestId, size: input.size, userId: authData.user.id },
      "Video upload authorized",
    );

    return Response.json(
      {
        project,
        upload: {
          endpoint: getDirectStorageUrl(),
          path: sourcePath,
          token: signedUpload.token,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
