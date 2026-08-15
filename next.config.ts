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
  async headers() {
    return [
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
