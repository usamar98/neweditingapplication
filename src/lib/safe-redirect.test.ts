import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

describe("getSafeRedirectPath", () => {
  it("allows internal application paths", () => {
    expect(getSafeRedirectPath("/editingappadmin")).toBe("/editingappadmin");
    expect(getSafeRedirectPath("/account?tab=billing")).toBe("/account?tab=billing");
  });

  it("rejects external and malformed redirect targets", () => {
    expect(getSafeRedirectPath("https://example.com")).toBe("/clipper");
    expect(getSafeRedirectPath("//example.com")).toBe("/clipper");
    expect(getSafeRedirectPath("/\\example.com")).toBe("/clipper");
  });
});
