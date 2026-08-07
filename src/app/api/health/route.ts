import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      configured: isSupabaseConfigured(),
      service: "scene-forge-web",
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
