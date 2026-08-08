import { z } from "zod";
import { getGeneration } from "@/lib/data/generations";
import { errorResponse, getRequestId, HttpError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);

  try {
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new HttpError(401, "Sign in to view generated media.", "UNAUTHENTICATED");
    }
    const generation = await getGeneration(id);
    if (!generation) {
      throw new HttpError(404, "Generation not found.", "GENERATION_NOT_FOUND");
    }
    return Response.json({ generation });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
