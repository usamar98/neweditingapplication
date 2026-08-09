import { afterEach, describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";

const originalSiteUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalSiteUrl;
});

describe("crawler metadata", () => {
  it("emits final www canonical URLs for every sitemap entry", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://editingapp.live";
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls.every((url) => url.startsWith("https://www.editingapp.live/"))).toBe(true);
    expect(urls).toContain("https://www.editingapp.live/tools/product-url-to-video");
    expect(urls).toContain("https://www.editingapp.live/tools/long-video-to-shorts");
    expect(urls).toContain("https://www.editingapp.live/compare/editing-app-vs-veed");
    expect(urls).toContain("https://www.editingapp.live/compare/editing-app-vs-creatify");
    expect(urls).toContain("https://www.editingapp.live/compare/editing-app-vs-opusclip");
  });

  it("advertises the www sitemap and blocks private API routes", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://editingapp.live";
    const metadata = robots();
    const rules = Array.isArray(metadata.rules) ? metadata.rules : [metadata.rules];

    expect(metadata.sitemap).toBe("https://www.editingapp.live/sitemap.xml");
    expect(metadata.host).toBe("https://www.editingapp.live");
    expect(rules.flatMap((rule) => rule.disallow ?? [])).toContain("/api/");
  });
});
