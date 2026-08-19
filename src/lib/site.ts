export const siteName = "Editing App";
export const siteDescription = "Create AI videos and images, animate photos, turn long videos into shorts, build product ads from URLs, and remove backgrounds in one private workspace.";
export const productionSiteUrl = "https://www.editingapp.live";
export const brandLogoPath = "/logo-512.png";

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const url = new URL(raw.endsWith("/") ? raw : `${raw}/`);

  // The apex domain permanently redirects to www in production. Keep every
  // canonical, sitemap entry, and social URL on the final 200 response.
  if (url.hostname === "editingapp.live") url.hostname = "www.editingapp.live";

  return url;
}
