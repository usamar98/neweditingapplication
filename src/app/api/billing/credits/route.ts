import { claimWelcomeCredits, getCreditSummary } from "@/lib/credits";
import { errorResponse, getRequestId, HttpError } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new HttpError(401, "Sign in to view credits.", "UNAUTHENTICATED");
    }
    return Response.json({ credits: await getCreditSummary(supabase) });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new HttpError(401, "Sign in to claim welcome credits.", "UNAUTHENTICATED");
    }

    const claim = await claimWelcomeCredits(createAdminClient(), data.user.id);
    const credits = await getCreditSummary(supabase);
    return Response.json({ claim, credits });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
