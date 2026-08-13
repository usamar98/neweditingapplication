import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const createCheckoutSession = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getAppUrl: () => "https://www.editingapp.live",
  getStripe: () => ({
    checkout: { sessions: { create: createCheckoutSession } },
    customers: { create: vi.fn() },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { email: "creator@example.com", id: "user-123" } },
        error: null,
      }),
    },
  }),
}));

const maybeSingle = vi.fn(async () => ({
  data: {
    stripe_customer_id: "cus_existing",
    stripe_subscription_id: null,
    subscription_status: null,
  },
  error: null,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  }),
}));

const { POST } = await import("./route");

function request(body: unknown) {
  return new Request("https://www.editingapp.live/api/billing/checkout", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "x-request-id": "request-123" },
    method: "POST",
  });
}

describe("billing checkout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createCheckoutSession.mockResolvedValue({ url: "https://checkout.stripe.com/session" });
  });

  it("creates a monthly inline recurring price from the server plan", async () => {
    const response = await POST(request({ amount: 1, plan: "studio" }));

    expect(response.status).toBe(200);
    expect(createCheckoutSession).toHaveBeenCalledOnce();
    const [session] = createCheckoutSession.mock.calls[0];
    expect(session.line_items).toEqual([{
      price_data: {
        currency: "usd",
        product_data: {
          description: "3,500 monthly Editing App credits",
          metadata: { plan: "studio" },
          name: "Editing App Studio",
        },
        recurring: { interval: "month", interval_count: 1 },
        unit_amount: 4_999,
      },
      quantity: 1,
    }]);
    expect(session.line_items[0]).not.toHaveProperty("price");
    expect(session.mode).toBe("subscription");
    expect(session.subscription_data.metadata).toEqual({
      plan: "studio",
      supabase_user_id: "user-123",
    });
  });
});
