import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import manifest from "./manifest";
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
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain("https://www.editingapp.live/features");
    expect(urls).toContain("https://www.editingapp.live/tools");
    expect(urls).toContain("https://www.editingapp.live/blog");
    expect(urls).toContain("https://www.editingapp.live/blog/remove-background-from-product-photo");
    expect(urls).toContain("https://www.editingapp.live/compare");
    expect(urls).toContain("https://www.editingapp.live/pricing");
    expect(urls).toContain("https://www.editingapp.live/legal");
    expect(urls).toContain("https://www.editingapp.live/legal/privacy");
    expect(urls).toContain("https://www.editingapp.live/tools/product-url-to-video");
    expect(urls).toContain("https://www.editingapp.live/tools/long-video-to-shorts");
    expect(urls).toContain("https://www.editingapp.live/tools/ai-video-generator");
    expect(urls).toContain("https://www.editingapp.live/tools/image-to-video-ai");
    expect(urls).toContain("https://www.editingapp.live/tools/ai-image-generator");
    expect(urls).toContain("https://www.editingapp.live/tools/product-photo-background-remover");
    expect(urls).toContain("https://www.editingapp.live/compare/editing-app-vs-veed");
    expect(urls).toContain("https://www.editingapp.live/compare/editing-app-vs-creatify");
    expect(urls).toContain("https://www.editingapp.live/compare/editing-app-vs-opusclip");
    const privatePrefixes = ["/account", "/clipper", "/creative-studio", "/dashboard", "/generate/", "/login", "/projects/", "/remove-background"];
    expect(urls.some((url) => {
      const pathname = new URL(url).pathname;
      return privatePrefixes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    })).toBe(false);
    expect(entries.every((entry) => entry.lastModified instanceof Date)).toBe(true);
  });

  it("advertises the www sitemap and blocks private API routes", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://editingapp.live";
    const metadata = robots();
    const rules = Array.isArray(metadata.rules) ? metadata.rules : [metadata.rules];

    expect(metadata.sitemap).toBe("https://www.editingapp.live/sitemap.xml");
    expect(metadata.host).toBe("https://www.editingapp.live");
    expect(rules.flatMap((rule) => rule.disallow ?? [])).toContain("/api/");
    expect(rules.flatMap((rule) => rule.disallow ?? [])).toContain("/auth/");
    expect(rules.flatMap((rule) => rule.allow ?? [])).toContain("/");
  });

  it("publishes stable crawlable brand icon URLs", () => {
    const metadata = manifest();
    const icons = metadata.icons ?? [];

    expect(icons).toContainEqual(expect.objectContaining({ src: "/icon-192.png", sizes: "192x192", type: "image/png" }));
    expect(icons).toContainEqual(expect.objectContaining({ src: "/logo-512.png", sizes: "512x512", type: "image/png" }));
    expect(icons).toContainEqual(expect.objectContaining({ src: "/apple-icon.png", sizes: "180x180", type: "image/png" }));
    expect(icons).toContainEqual(expect.objectContaining({ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }));
    expect(icons.every((icon) => !icon.src.includes("?"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "public/icon-192.png"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "public/logo-512.png"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "public/llms.txt"))).toBe(true);
  });
});
