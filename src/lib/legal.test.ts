import { describe, expect, it } from "vitest";
import { legalDocuments, legalEffectiveDate, legalVersion } from "./legal";

describe("legal document catalog", () => {
  it("covers every material product and trust area with unique routes", () => {
    const slugs = legalDocuments.map((document) => document.slug);
    expect(legalDocuments).toHaveLength(10);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(expect.arrayContaining([
      "terms",
      "privacy",
      "subscriptions-credits-refunds",
      "acceptable-use",
      "ai-generated-content",
      "cookies",
      "subprocessors",
      "security",
      "copyright-content-complaints",
      "accessibility",
    ]));
    expect(slugs.every((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))).toBe(true);
  });

  it("ships substantial, navigable, versioned documents", () => {
    expect(legalVersion).toBe("2026-08-16");
    expect(legalEffectiveDate).toContain("2026");
    for (const document of legalDocuments) {
      expect(document.description.length).toBeGreaterThan(80);
      expect(document.summary.length).toBeGreaterThan(50);
      expect(document.sections.length).toBeGreaterThanOrEqual(4);
      expect(new Set(document.sections.map((section) => section.id)).size).toBe(document.sections.length);
    }
  });

  it("does not publish credentials, environment names, internal API paths, or secret formats", () => {
    const publicCopy = JSON.stringify(legalDocuments);
    expect(publicCopy).not.toMatch(/sk_(?:live|test)_|whsec_|sb_secret_|service_role|SUPABASE_|STRIPE_|FAL_KEY|\/api\//i);
  });
});
