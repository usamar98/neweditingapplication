import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/config";
import { getServerEnv } from "@/lib/server-env";
import type { Database } from "@/types/database.generated";

export function createAdminClient() {
  const { url } = getPublicSupabaseConfig();
  const { SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey } = getServerEnv();

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: { "X-Client-Info": "scene-forge-web-server" },
    },
  });
}
