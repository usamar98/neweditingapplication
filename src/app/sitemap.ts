import type { MetadataRoute } from "next";
import { marketingFeatures } from "@/lib/marketing/features";
import { comparisonPages, searchIntentPages } from "@/lib/marketing/seo-pages";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date("2026-08-10T00:00:00.000Z");
  return [
    { url: siteUrl.toString(), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/features", siteUrl).toString(), lastModified, changeFrequency: "weekly", priority: 0.95 },
    { url: new URL("/tools", siteUrl).toString(), lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: new URL("/pricing", siteUrl).toString(), lastModified, changeFrequency: "monthly", priority: 0.85 },
    { url: new URL("/compare", siteUrl).toString(), lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: new URL("/ai-video-models", siteUrl).toString(), lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...marketingFeatures.map((feature) => ({
      url: new URL(`/features/${feature.slug}`, siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...searchIntentPages.map((page) => ({
      url: new URL(`/tools/${page.slug}`, siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    ...comparisonPages.map((page) => ({
      url: new URL(`/compare/${page.slug}`, siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
