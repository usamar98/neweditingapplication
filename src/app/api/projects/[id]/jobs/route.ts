import { z } from "zod";
import { enqueueJobSchema } from "@/lib/domain/video";
import { errorResponse, getRequestId, HttpError } from "@/lib/http";
import { enqueueProjectJob } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);

  try {
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const input = enqueueJobSchema.parse(await request.json());
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new HttpError(401, "Sign in to process a video.", "UNAUTHENTICATED");
    }

    const job = await enqueueProjectJob({
      kind: input.kind,
      projectId: id,
      requestId,
      supabase,
      user: authData.user,
    });

    return Response.json({ job }, { status: 202 });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
