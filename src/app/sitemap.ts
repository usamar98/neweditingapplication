import type { MetadataRoute } from "next";
import { marketingFeatures } from "@/lib/marketing/features";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date("2026-08-09T00:00:00.000Z");
  return [
    { url: siteUrl.toString(), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/ai-video-models", siteUrl).toString(), lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...marketingFeatures.map((feature) => ({
      url: new URL(`/features/${feature.slug}`, siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
