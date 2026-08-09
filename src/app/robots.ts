import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [{
      userAgent: "*",
      allow: ["/", "/features/"],
      disallow: ["/account", "/api/", "/auth/", "/creative-studio", "/dashboard", "/generate/", "/login", "/projects/", "/reactivate", "/remove-background"],
    }],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
