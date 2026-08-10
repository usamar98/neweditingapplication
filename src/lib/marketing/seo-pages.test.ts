import { describe, expect, it } from "vitest";
import { marketingFeatures } from "./features";
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

  it("links every search-intent page to a real feature page", () => {
    const featurePaths = new Set(marketingFeatures.map((feature) => `/features/${feature.slug}`));
    for (const page of searchIntentPages) {
      expect(featurePaths.has(page.featureHref)).toBe(true);
      expect(page.title).not.toBe(page.eyebrow);
    }
  });

  it("keeps feature titles and descriptions unique", () => {
    expect(new Set(marketingFeatures.map((feature) => feature.title)).size).toBe(marketingFeatures.length);
    expect(new Set(marketingFeatures.map((feature) => feature.description)).size).toBe(marketingFeatures.length);
  });

  it("keeps search-result titles distinct and concise", () => {
    const seoTitles = [...marketingFeatures, ...searchIntentPages, ...comparisonPages].map((page) => page.seoTitle);
    expect(new Set(seoTitles).size).toBe(seoTitles.length);
    expect(seoTitles.every((title) => title.length <= 50)).toBe(true);
  });
});
