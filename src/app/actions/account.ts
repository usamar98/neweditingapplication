"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { z } from "zod";
import { getPublicSupabaseConfig } from "@/lib/config";
import { USERNAME_PATTERN } from "@/lib/domain/username";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  username: z.string().trim().toLowerCase().regex(USERNAME_PATTERN),
});

async function authenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : { supabase, user: data.user };
}

export async function updateProfile(input: { displayName: string; username: string }) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: "Use a 2–80 character name and a 3–30 character lowercase username." };
  const auth = await authenticatedUser();
  if (!auth) return { error: "Your session expired. Sign in again." };
  const { error } = await auth.supabase.from("profiles").update({
    display_name: parsed.data.displayName,
    username: parsed.data.username,
  }).eq("id", auth.user.id);
  if (error?.code === "23505") return { error: "That username is already taken." };
  if (error) return { error: "Profile could not be updated." };
  return { error: null };
}

export async function updateAvatar(avatarPath: string) {
  const auth = await authenticatedUser();
  if (!auth) return { error: "Your session expired. Sign in again." };
  if (avatarPath !== `${auth.user.id}/avatar`) return { error: "Invalid avatar path." };
  const { url } = getPublicSupabaseConfig();
  const avatarUrl = `${url}/storage/v1/object/public/avatars/${encodeURIComponent(auth.user.id)}/avatar`;
  const { error } = await auth.supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", auth.user.id);
  return { error: error ? "Avatar uploaded but the profile could not be updated." : null, avatarUrl };
}

export async function deactivateAccount() {
  const auth = await authenticatedUser();
  if (!auth) return { error: "Your session expired. Sign in again." };
  const { data: billing } = await auth.supabase
    .from("billing_accounts")
    .select("cancel_at_period_end,subscription_status")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!billing?.cancel_at_period_end && billing?.subscription_status && ["active", "trialing", "past_due", "unpaid"].includes(billing.subscription_status)) {
    return { error: "Cancel the subscription from Billing before deactivating this account." };
  }
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({
    account_status: "inactive",
    deactivated_at: new Date().toISOString(),
  }).eq("id", auth.user.id);
  if (error) return { error: "Account could not be deactivated." };
  await auth.supabase.auth.signOut();
  redirect("/login?notice=deactivated");
}

export async function reactivateAccount() {
  const auth = await authenticatedUser();
  if (!auth) redirect("/login");
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ account_status: "active", deactivated_at: null }).eq("id", auth.user.id);
  if (error) redirect("/reactivate?error=1" as Route);
  redirect("/clipper");
}

async function removeUserObjects(bucket: string, userId: string) {
  const admin = createAdminClient();
  const objects: string[] = [];
  async function walk(folder: string, depth: number) {
    if (depth > 8) throw new Error("Storage folder depth exceeded the account cleanup limit.");
    let offset = 0;
    while (true) {
      const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 100, offset });
      if (error) throw error;
      for (const entry of data ?? []) {
        const path = `${folder}/${entry.name}`;
        if (entry.id) objects.push(path);
        else await walk(path, depth + 1);
      }
      if (!data || data.length < 100) break;
      offset += data.length;
    }
  }
  await walk(userId, 0);
  for (let index = 0; index < objects.length; index += 100) {
    const { error } = await admin.storage.from(bucket).remove(objects.slice(index, index + 100));
    if (error) throw error;
  }
}

export async function deleteAccount(password: string) {
  const auth = await authenticatedUser();
  if (!auth || !auth.user.email) return { error: "Your session expired. Sign in again." };
  const verification = await auth.supabase.auth.signInWithPassword({ email: auth.user.email, password });
  if (verification.error) return { error: "Password confirmation failed." };
  const admin = createAdminClient();
  const { data: billing } = await admin
    .from("billing_accounts")
    .select("stripe_subscription_id,subscription_status")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (billing?.stripe_subscription_id && billing.subscription_status !== "canceled") {
    const stripe = getStripe();
    if (!stripe) return { error: "Stripe is unavailable, so the account was not deleted while billing may still be active." };
    try {
      await stripe.subscriptions.cancel(billing.stripe_subscription_id, { invoice_now: false, prorate: false });
    } catch {
      return { error: "The subscription could not be cancelled, so the account was not deleted." };
    }
  }
  try {
    for (const bucket of ["avatars", "background-inputs", "video-sources", "video-outputs", "video-assets"]) {
      await removeUserObjects(bucket, auth.user.id);
    }
  } catch {
    return { error: "Private files could not be removed, so the account was not deleted." };
  }
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) return { error: "Account deletion failed." };
  await auth.supabase.auth.signOut();
  redirect("/?account=deleted");
}
