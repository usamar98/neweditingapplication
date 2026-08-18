import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const siteUrl = getSiteUrl();
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/clipper";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/clipper";

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, siteUrl));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirmation_failed", siteUrl));
}
