import { z } from "zod";
import {
  editSettingsSchema,
  VIDEO_ASSET_BUCKET,
  VIDEO_OUTPUT_BUCKET,
  VIDEO_SOURCE_BUCKET,
} from "@/lib/domain/video";
import { errorResponse, getRequestId, HttpError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

type ProjectRouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const requestId = getRequestId(request);

  try {
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const settings = editSettingsSchema.parse(await request.json());
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      throw new HttpError(401, "Sign in to update a project.", "UNAUTHENTICATED");
    }

    const { data: project } = await supabase
      .from("projects")
      .select("duration_seconds")
      .eq("id", id)
      .maybeSingle();
    if (!project) {
      throw new HttpError(404, "Project not found.", "PROJECT_NOT_FOUND");
    }
    if (
      settings.trimEnd !== null &&
      project.duration_seconds !== null &&
      settings.trimEnd > Number(project.duration_seconds) + 0.05
    ) {
      throw new HttpError(400, "Trim end exceeds the video duration.", "INVALID_TRIM_RANGE");
    }

    const { error } = await supabase
      .from("projects")
      .update({ edit_settings: settings })
      .eq("id", id);
    if (error) {
      throw new HttpError(500, "Unable to save clip settings.", "PROJECT_UPDATE_FAILED");
    }

    return Response.json({ saved: true });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function DELETE(request: Request, context: ProjectRouteContext) {
  const requestId = getRequestId(request);

  try {
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      throw new HttpError(401, "Sign in to delete a project.", "UNAUTHENTICATED");
    }

    const { data: project } = await supabase
      .from("projects")
      .select("source_path,export_path,thumbnail_path")
      .eq("id", id)
      .maybeSingle();
    if (!project) {
      throw new HttpError(404, "Project not found.", "PROJECT_NOT_FOUND");
    }

    const { data: projectJobs } = await supabase
      .from("jobs")
      .select("id,kind")
      .eq("project_id", id)
      .limit(1000);
    const objectPrefix = `${authData.user.id}/${id}`;
    const analysisJobIds = (projectJobs ?? []).filter((job) => job.kind === "analyze").map((job) => job.id);
    const exportJobIds = (projectJobs ?? []).filter((job) => job.kind === "export").map((job) => job.id);
    const assetPaths = analysisJobIds.flatMap((jobId) => [
      `${objectPrefix}/analysis/${jobId}/thumbnail.jpg`,
      `${objectPrefix}/analysis/${jobId}/transcript.json`,
      `${objectPrefix}/analysis/${jobId}/captions.vtt`,
    ]);
    if (project.thumbnail_path) assetPaths.push(project.thumbnail_path);
    const outputPaths = exportJobIds.map((jobId) => `${objectPrefix}/exports/${jobId}.mp4`);
    if (project.export_path) outputPaths.push(project.export_path);
    const removals: Promise<unknown>[] = [
      supabase.storage.from(VIDEO_SOURCE_BUCKET).remove([project.source_path]),
    ];
    if (outputPaths.length > 0) {
      removals.push(supabase.storage.from(VIDEO_OUTPUT_BUCKET).remove([...new Set(outputPaths)]));
    }
    if (assetPaths.length > 0) {
      removals.push(supabase.storage.from(VIDEO_ASSET_BUCKET).remove([...new Set(assetPaths)]));
    }
    await Promise.allSettled(removals);

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      throw new HttpError(500, "Unable to delete the project.", "PROJECT_DELETE_FAILED");
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
