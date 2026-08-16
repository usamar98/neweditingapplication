import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

function getAllowlist(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminIdentity(user: Pick<User, "app_metadata" | "email" | "id"> | null | undefined) {
  if (!user) return false;
  const role = typeof user.app_metadata?.role === "string" ? user.app_metadata.role.toLowerCase() : "";
  if (role === "admin") return true;

  const allowedIds = getAllowlist(process.env.ADMIN_USER_IDS);
  if (allowedIds.has(user.id.toLowerCase())) return true;

  const allowedEmails = getAllowlist(process.env.ADMIN_EMAILS);
  return Boolean(user.email && allowedEmails.has(user.email.toLowerCase()));
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Feditingappadmin");
  if (!isAdminIdentity(user)) redirect("/clipper");
  return user;
}
