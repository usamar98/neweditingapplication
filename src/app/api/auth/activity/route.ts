import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getCountryCode(request: Request) {
  const value = request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry");
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const countryCode = getCountryCode(request);
  const supabase = await createClient();
  const { error } = await supabase.from("user_activity").upsert(
    {
      ...(countryCode ? { country_code: countryCode } : {}),
      last_seen_at: new Date().toISOString(),
      user_id: user.id,
    },
    { onConflict: "user_id" },
  );

  if (error) return Response.json({ error: "Unable to record activity" }, { status: 500 });
  return new Response(null, { status: 204 });
}
