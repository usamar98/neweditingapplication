import "server-only";

import type { User } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";
import { billingPlans, type BillingPlanKey } from "@/lib/domain/billing";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.generated";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type BillingAccount = Database["public"]["Tables"]["billing_accounts"]["Row"];
type UserActivity = Database["public"]["Tables"]["user_activity"]["Row"];

export type AdminUserRow = {
  accountStatus: string;
  avatarUrl: string | null;
  countryCode: string | null;
  countryName: string;
  displayName: string;
  email: string;
  id: string;
  isNew: boolean;
  isOnline: boolean;
  joinedAt: string;
  lastSeenAt: string | null;
  lastSignInAt: string | null;
  plan: string;
  subscriptionStatus: string | null;
  username: string;
};

export type AdminDashboardData = {
  countries: { code: string; count: number; name: string; share: number }[];
  generatedAt: string;
  growth: { cumulative: number; date: string; label: string; signups: number }[];
  overview: {
    activeSubscriptions: number;
    conversionRate: number;
    loginsToday: number;
    monthlyRecurringRevenue: number;
    newUsers: number;
    onlineUsers: number;
    totalUsers: number;
  };
  planMix: { color: string; count: number; key: string; label: string; share: number }[];
  profitability: {
    collectedRevenue: number;
    creditsConsumed: number;
    creditsReserved: number;
    estimatedApiCost: number;
    grossMargin: number;
    grossProfit: number;
    models: {
      creditsConsumed: number;
      estimatedApiCost: number;
      jobs: number;
      modelKey: string;
    }[];
  };
  users: AdminUserRow[];
};

// Keep ID filters comfortably below common proxy URL limits while still
// loading the complete user directory page by page.
const AUTH_PAGE_SIZE = 200;
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const NEW_USER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const planPriceByKey = new Map<BillingPlanKey, number>(
  billingPlans.map((plan) => [plan.key, Number(plan.price.replace(/[^0-9.]/g, ""))]),
);
const planColors: Record<string, string> = {
  business: "#60a5fa",
  creator: "#34d399",
  starter: "#64748b",
  studio: "#a78bfa",
};

function countryName(code: string | null) {
  if (!code) return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function loadAllUsers() {
  const admin = createAdminClient();
  const authUsers: User[] = [];
  const profiles: Profile[] = [];
  const billingAccounts: BillingAccount[] = [];
  const activityRows: UserActivity[] = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE });
    if (error) throw new Error(`Unable to load authentication users: ${error.message}`);
    const pageUsers = data.users;
    authUsers.push(...pageUsers);

    if (pageUsers.length > 0) {
      const ids = pageUsers.map((user) => user.id);
      const [profileResult, billingResult, activityResult] = await Promise.all([
        admin.from("profiles").select("*").in("id", ids),
        admin.from("billing_accounts").select("*").in("user_id", ids),
        admin.from("user_activity").select("*").in("user_id", ids),
      ]);
      if (profileResult.error) throw new Error(`Unable to load profiles: ${profileResult.error.message}`);
      if (billingResult.error) throw new Error(`Unable to load subscriptions: ${billingResult.error.message}`);
      if (activityResult.error) throw new Error(`Unable to load activity: ${activityResult.error.message}`);
      profiles.push(...profileResult.data);
      billingAccounts.push(...billingResult.data);
      activityRows.push(...activityResult.data);
    }

    if (pageUsers.length < AUTH_PAGE_SIZE) break;
  }

  return { activityRows, authUsers, billingAccounts, profiles };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireAdmin();
  const now = new Date();
  const nowMs = now.getTime();
  const admin = createAdminClient();
  const [directory, revenueResult, costResult, creditAccountsResult] = await Promise.all([
    loadAllUsers(),
    admin.from("billing_revenue_events").select("amount_paid_cents"),
    admin
      .from("credit_reservations")
      .select("actual_provider_cost_micros,credits_reserved,estimated_provider_cost_micros,model_key")
      .eq("status", "settled"),
    admin.from("credit_accounts").select("consumed_credits,reserved_credits"),
  ]);
  if (revenueResult.error) throw new Error(`Unable to load collected revenue: ${revenueResult.error.message}`);
  if (costResult.error) throw new Error(`Unable to load provider costs: ${costResult.error.message}`);
  if (creditAccountsResult.error) throw new Error(`Unable to load credit utilization: ${creditAccountsResult.error.message}`);
  const { activityRows, authUsers, billingAccounts, profiles } = directory;
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const billingById = new Map(billingAccounts.map((billing) => [billing.user_id, billing]));
  const activityById = new Map(activityRows.map((activity) => [activity.user_id, activity]));

  const users = authUsers
    .map<AdminUserRow>((authUser) => {
      const profile = profileById.get(authUser.id);
      const billing = billingById.get(authUser.id);
      const activity = activityById.get(authUser.id);
      const joinedAt = profile?.created_at ?? authUser.created_at;
      const lastSeenMs = activity?.last_seen_at ? Date.parse(activity.last_seen_at) : 0;
      const normalizedCountryCode = activity?.country_code?.toUpperCase() ?? null;
      return {
        accountStatus: profile?.account_status ?? "active",
        avatarUrl: profile?.avatar_url ?? null,
        countryCode: normalizedCountryCode,
        countryName: countryName(normalizedCountryCode),
        displayName: profile?.display_name || profile?.username || authUser.email?.split("@")[0] || "Unnamed user",
        email: authUser.email ?? "No email",
        id: authUser.id,
        isNew: nowMs - Date.parse(joinedAt) <= NEW_USER_WINDOW_MS,
        isOnline: lastSeenMs > 0 && nowMs - lastSeenMs <= ONLINE_WINDOW_MS,
        joinedAt,
        lastSeenAt: activity?.last_seen_at ?? null,
        lastSignInAt: authUser.last_sign_in_at ?? null,
        plan: billing?.plan_key ?? profile?.plan ?? "starter",
        subscriptionStatus: billing?.subscription_status ?? null,
        username: profile?.username ?? `user_${authUser.id.slice(0, 8)}`,
      };
    })
    .sort((a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt));

  const activeSubscriptions = billingAccounts.filter((billing) =>
    ACTIVE_SUBSCRIPTION_STATUSES.has(billing.subscription_status ?? ""),
  );
  const monthlyRecurringRevenue = activeSubscriptions.reduce((total, billing) => {
    const plan = billing.plan_key as BillingPlanKey | null;
    return total + (plan ? (planPriceByKey.get(plan) ?? 0) : 0);
  }, 0);
  const todayStart = startOfUtcDay(now).getTime();

  const growthStart = startOfUtcDay(new Date(nowMs - 29 * 24 * 60 * 60 * 1000));
  const signupCounts = new Map<string, number>();
  let cumulative = users.filter((user) => Date.parse(user.joinedAt) < growthStart.getTime()).length;
  for (const user of users) {
    const joined = Date.parse(user.joinedAt);
    if (joined >= growthStart.getTime()) {
      const key = dateKey(new Date(joined));
      signupCounts.set(key, (signupCounts.get(key) ?? 0) + 1);
    }
  }
  const growth = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(growthStart.getTime() + index * 24 * 60 * 60 * 1000);
    const signups = signupCounts.get(dateKey(date)) ?? 0;
    cumulative += signups;
    return {
      cumulative,
      date: dateKey(date),
      label: new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC" }).format(date),
      signups,
    };
  });

  const planCounts = new Map<string, number>();
  for (const user of users) planCounts.set(user.plan, (planCounts.get(user.plan) ?? 0) + 1);
  const planOrder = ["creator", "studio", "business", "starter"];
  const planMix = planOrder
    .map((key) => {
      const count = planCounts.get(key) ?? 0;
      return {
        color: planColors[key] ?? "#94a3b8",
        count,
        key,
        label: key[0].toUpperCase() + key.slice(1),
        share: users.length ? (count / users.length) * 100 : 0,
      };
    })
    .filter((entry) => entry.count > 0 || entry.key === "starter");

  const countryCounts = new Map<string, number>();
  for (const user of users) {
    const code = user.countryCode ?? "unknown";
    countryCounts.set(code, (countryCounts.get(code) ?? 0) + 1);
  }
  const countries = [...countryCounts.entries()]
    .map(([code, count]) => ({
      code,
      count,
      name: code === "unknown" ? "Unknown" : countryName(code),
      share: users.length ? (count / users.length) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const collectedRevenue = revenueResult.data.reduce(
    (total, row) => total + row.amount_paid_cents / 100,
    0,
  );
  const estimatedApiCost = costResult.data.reduce(
    (total, row) => total + Number(row.actual_provider_cost_micros ?? row.estimated_provider_cost_micros) / 1_000_000,
    0,
  );
  const grossProfit = collectedRevenue - estimatedApiCost;
  const modelTotals = new Map<string, {
    creditsConsumed: number;
    estimatedApiCost: number;
    jobs: number;
  }>();
  for (const row of costResult.data) {
    const modelKey = row.model_key ?? "unclassified";
    const current = modelTotals.get(modelKey) ?? { creditsConsumed: 0, estimatedApiCost: 0, jobs: 0 };
    current.creditsConsumed += row.credits_reserved;
    current.estimatedApiCost += Number(row.actual_provider_cost_micros ?? row.estimated_provider_cost_micros) / 1_000_000;
    current.jobs += 1;
    modelTotals.set(modelKey, current);
  }
  const models = [...modelTotals.entries()]
    .map(([modelKey, totals]) => ({ modelKey, ...totals }))
    .sort((left, right) => right.estimatedApiCost - left.estimatedApiCost)
    .slice(0, 10);
  const creditsConsumed = creditAccountsResult.data.reduce((total, row) => total + row.consumed_credits, 0);
  const creditsReserved = creditAccountsResult.data.reduce((total, row) => total + row.reserved_credits, 0);

  return {
    countries,
    generatedAt: now.toISOString(),
    growth,
    overview: {
      activeSubscriptions: activeSubscriptions.length,
      conversionRate: users.length ? (activeSubscriptions.length / users.length) * 100 : 0,
      loginsToday: users.filter((user) => user.lastSignInAt && Date.parse(user.lastSignInAt) >= todayStart).length,
      monthlyRecurringRevenue,
      newUsers: users.filter((user) => user.isNew).length,
      onlineUsers: users.filter((user) => user.isOnline).length,
      totalUsers: users.length,
    },
    planMix,
    profitability: {
      collectedRevenue,
      creditsConsumed,
      creditsReserved,
      estimatedApiCost,
      grossMargin: collectedRevenue > 0 ? (grossProfit / collectedRevenue) * 100 : 0,
      grossProfit,
      models,
    },
    users,
  };
}
