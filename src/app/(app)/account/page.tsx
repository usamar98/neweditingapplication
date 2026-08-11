import { AccountSettings } from "@/components/account-settings";
import { getCurrentAccount, requireUser } from "@/lib/auth";
import { getCreditSummary } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();
  const [account, credits] = await Promise.all([
    getCurrentAccount(),
    createClient().then(getCreditSummary),
  ]);
  return <AccountSettings
    avatarUrl={account?.profile?.avatar_url ?? null}
    billing={{
      cancelAtPeriodEnd: account?.billing?.cancel_at_period_end ?? false,
      plan: account?.billing?.plan_key ?? null,
      status: account?.billing?.subscription_status ?? null,
      subscriptionId: account?.billing?.stripe_subscription_id ?? null,
    }}
    credits={credits}
    displayName={account?.profile?.display_name || user.email?.split("@")[0] || "Creator"}
    email={user.email ?? ""}
    userId={user.id}
    username={account?.profile?.username ?? `creator_${user.id.slice(0, 6)}`}
  />;
}
