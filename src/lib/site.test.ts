import { afterEach, describe, expect, it } from "vitest";
import { getSiteUrl } from "./site";

const originalSiteUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalSiteUrl;
});

describe("site URL", () => {
  it("normalizes the redirecting apex production domain to www", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://editingapp.live";
    expect(getSiteUrl().toString()).toBe("https://www.editingapp.live/");
  });

  it("preserves local development URLs", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(getSiteUrl().toString()).toBe("http://localhost:3000/");
  });
});
