import { importClipProjectSchema } from "@/lib/domain/video";
import { requireActiveSubscription } from "@/lib/credits";
import { errorResponse, getRequestId, HttpError } from "@/lib/http";
import { consumeRateLimit, enqueueProjectJob } from "@/lib/jobs";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  let projectId: string | undefined;
  let queued = false;

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new HttpError(401, "Sign in to import a video link.", "UNAUTHENTICATED");
    }

    await requireActiveSubscription(createAdminClient(), authData.user.id);
    const input = importClipProjectSchema.parse(await request.json());
    await consumeRateLimit(supabase, "project:link-import", 12, 3600);

    projectId = crypto.randomUUID();
    const sourcePath = `${authData.user.id}/${projectId}/source/${crypto.randomUUID()}.mp4`;
    const sourceHost = new URL(input.sourceUrl).hostname.replace(/^www\./, "");
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        id: projectId,
        name: input.name,
        source_filename: `${sourceHost}-video.mp4`,
        source_mime: "video/mp4",
        source_path: sourcePath,
        source_size_bytes: 1,
        user_id: authData.user.id,
      })
      .select("id,name,status,source_path")
      .single();

    if (projectError || !project) {
      throw new HttpError(500, "Unable to create the clip project.", "PROJECT_CREATE_FAILED");
    }

    const job = await enqueueProjectJob({
      kind: "analyze",
      projectId,
      requestId,
      sourceUrl: input.sourceUrl,
      supabase,
      user: authData.user,
    });
    queued = true;

    logger.info({ projectId, requestId, sourceHost, userId: authData.user.id }, "Video link import queued");
    return Response.json({ job, project }, { status: 202 });
  } catch (error) {
    if (projectId && !queued) {
      const admin = createAdminClient();
      await admin.from("projects").delete().eq("id", projectId);
    }
    return errorResponse(error, requestId);
  }
}
