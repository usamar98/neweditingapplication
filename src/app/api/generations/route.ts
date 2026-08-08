import { generationRequestSchema } from "@/lib/domain/generation";
import { errorResponse, getRequestId, HttpError } from "@/lib/http";
import { enqueueGenerationJob } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const input = generationRequestSchema.parse(await request.json());
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new HttpError(401, "Sign in to generate media.", "UNAUTHENTICATED");
    }

    const result = await enqueueGenerationJob({ input, requestId, supabase, user: data.user });
    return Response.json(result, { status: 202 });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
