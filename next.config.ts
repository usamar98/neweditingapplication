import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NEXT_OUTPUT === "standalone" ? { output: "standalone" as const } : {}),
  poweredByHeader: false,
  typedRoutes: true,
  async redirects() {
    return [
      { source: "/features/ai-video-editor", destination: "/dashboard", permanent: true },
      { source: "/features/ai-video-generator", destination: "/generate/video", permanent: true },
      { source: "/features/ai-image-generator", destination: "/generate/image", permanent: true },
      { source: "/features/performance-creative-studio", destination: "/creative-studio", permanent: true },
      { source: "/features/background-remover", destination: "/remove-background", permanent: true },
    ];
  },
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/favicon.svg" }];
  },
  async headers() {
    return [
      {
        source: "/:asset(favicon.svg|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
