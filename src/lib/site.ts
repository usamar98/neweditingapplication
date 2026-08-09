export const siteName = "Editing App";
export const siteDescription = "Edit footage, generate premium AI video and images, remove backgrounds, and turn product pages into performance creative in one private workspace.";

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return new URL(raw.endsWith("/") ? raw : `${raw}/`);
}
