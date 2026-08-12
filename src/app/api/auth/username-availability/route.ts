import { isValidUsername, normalizeUsername } from "@/lib/domain/username";
import { errorResponse, getRequestId, HttpError } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      throw new HttpError(400, "The request body must be valid JSON.", "INVALID_JSON");
    }

    const rawUsername = typeof input === "object" && input !== null && "username" in input
      ? (input as { username?: unknown }).username
      : undefined;

    if (typeof rawUsername !== "string" || !isValidUsername(rawUsername)) {
      throw new HttpError(
        400,
        "Use 3–30 lowercase letters, numbers, or underscores.",
        "INVALID_USERNAME",
      );
    }

    const username = normalizeUsername(rawUsername);
    const { data, error } = await createAdminClient()
      .from("profiles")
      .select("id")
      .eq("username", username)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new HttpError(
        503,
        "Username availability cannot be checked right now.",
        "USERNAME_CHECK_UNAVAILABLE",
      );
    }

    return Response.json(
      { available: data === null, username },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
