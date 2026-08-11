import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "@/components/admin-dashboard";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const data: AdminDashboardData = {
  countries: [{ code: "US", count: 1, name: "United States", share: 100 }],
  generatedAt: "2026-08-09T12:00:00.000Z",
  growth: Array.from({ length: 30 }, (_, index) => ({
    cumulative: index === 29 ? 1 : 0,
    date: `2026-07-${String(index + 11).padStart(2, "0")}`,
    label: `Day ${index + 1}`,
    signups: index === 29 ? 1 : 0,
  })),
  overview: {
    activeSubscriptions: 1,
    conversionRate: 100,
    loginsToday: 1,
    monthlyRecurringRevenue: 49.99,
    newUsers: 1,
    onlineUsers: 1,
    totalUsers: 1,
  },
  planMix: [{ color: "#a78bfa", count: 1, key: "studio", label: "Studio", share: 100 }],
  profitability: {
    collectedRevenue: 49.99,
    creditsConsumed: 50,
    creditsReserved: 10,
    estimatedApiCost: 0.4,
    grossMargin: 99.2,
    grossProfit: 49.59,
    models: [{ creditsConsumed: 50, estimatedApiCost: 0.4, jobs: 1, modelKey: "fal-ai/veo3.1/fast" }],
  },
  users: [{
    accountStatus: "active",
    avatarUrl: null,
    countryCode: "US",
    countryName: "United States",
    displayName: "Ada Creator",
    email: "ada@example.com",
    id: "user-1",
    isNew: true,
    isOnline: true,
    joinedAt: "2026-08-09T10:00:00.000Z",
    lastSeenAt: "2026-08-09T11:59:00.000Z",
    lastSignInAt: "2026-08-09T11:30:00.000Z",
    plan: "studio",
    subscriptionStatus: "active",
    username: "ada_creator",
  }],
};

describe("AdminDashboard", () => {
  it("renders business metrics and the user directory", () => {
    const html = renderToStaticMarkup(<AdminDashboard adminEmail="owner@example.com" data={data} />);

    expect(html).toContain("Business intelligence");
    expect(html).toContain("$49.99");
    expect(html).toContain("Thirty-day user growth");
    expect(html).toContain("Ada Creator");
    expect(html).toContain("Online now");
    expect(html).toContain("United States");
  });
});
