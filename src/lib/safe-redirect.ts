import type { Route } from "next";

export function getSafeRedirectPath(value: unknown, fallback: Route = "/dashboard") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value as Route;
}
