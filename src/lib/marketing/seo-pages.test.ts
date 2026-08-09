import { describe, expect, it } from "vitest";
import { comparisonPages, searchIntentPages } from "./seo-pages";

describe("SEO landing page catalog", () => {
  it("uses unique, human-readable slugs", () => {
    const slugs = [...searchIntentPages, ...comparisonPages].map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))).toBe(true);
  });

  it("ships substantial, answer-led content for every search-intent page", () => {
    for (const page of searchIntentPages) {
      expect(page.description.length).toBeGreaterThan(100);
      expect(page.steps.length).toBeGreaterThanOrEqual(4);
      expect(page.faq.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps comparison pages balanced and source-linked", () => {
    for (const page of comparisonPages) {
      expect(page.rows.length).toBeGreaterThanOrEqual(5);
      expect(page.competitorUrl).toMatch(/^https:\/\//);
      expect(page.competitorBestFor.length).toBeGreaterThan(40);
    }
  });
});
