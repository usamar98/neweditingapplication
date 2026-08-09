import "server-only";

import { cache } from "react";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
});

export const getCurrentAccount = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const [{ data: profile }, { data: billing }] = await Promise.all([
    supabase.from("profiles").select("id,display_name,username,avatar_url,plan,account_status,deactivated_at").eq("id", user.id).maybeSingle(),
    supabase.from("billing_accounts").select("plan_key,subscription_status,cancel_at_period_end,stripe_customer_id,stripe_subscription_id").eq("user_id", user.id).maybeSingle(),
  ]);
  return { billing, profile, user };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.account_status === "inactive") redirect("/reactivate" as Route);
  return user;
}
