import { z } from "zod";
import { errorResponse, getRequestId, HttpError } from "@/lib/http";
import { dismissJobForUser } from "@/lib/job-dismissal";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);

  try {
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new HttpError(401, "Sign in to remove a process.", "UNAUTHENTICATED");
    }

    const { data: job, error: lookupError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) {
      throw new HttpError(500, "Unable to check this process.", "JOB_LOOKUP_FAILED");
    }
    if (!job) {
      throw new HttpError(404, "Process not found.", "JOB_NOT_FOUND");
    }

    const dismissal = await dismissJobForUser({
      jobId: id,
      requestId,
      userId: authData.user.id,
    });
    return Response.json({ dismissal });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
