import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [{
      userAgent: "*",
      allow: ["/", "/ai-video-models", "/compare", "/features", "/legal", "/pricing", "/tools"],
      disallow: ["/account", "/api/", "/auth/", "/clipper", "/creative-studio", "/dashboard", "/generate/", "/login", "/projects/", "/reactivate", "/remove-background"],
    }],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
