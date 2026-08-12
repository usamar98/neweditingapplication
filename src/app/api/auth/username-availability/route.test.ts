import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const maybeSingle = vi.fn();
const limit = vi.fn(() => ({ maybeSingle }));
const eq = vi.fn(() => ({ limit }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from }),
}));

const { POST } = await import("./route");

function request(body: unknown) {
  return new Request("https://www.editingapp.live/api/auth/username-availability", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

describe("username availability route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns available for a normalized unused username", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await POST(request({ username: "  Ada_Creates  " }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ available: true, username: "ada_creates" });
    expect(eq).toHaveBeenCalledWith("username", "ada_creates");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns unavailable without exposing the matching profile", async () => {
    maybeSingle.mockResolvedValue({ data: { id: "private-user-id" }, error: null });

    const response = await POST(request({ username: "existing_user" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ available: false, username: "existing_user" });
  });

  it("rejects invalid usernames before querying the database", async () => {
    const response = await POST(request({ username: "not-valid" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_USERNAME" },
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("fails closed when the database check is unavailable", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: "database unavailable" } });

    const response = await POST(request({ username: "new_creator" }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "USERNAME_CHECK_UNAVAILABLE" },
    });
  });
});
