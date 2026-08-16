import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { AuthActivityTracker } from "@/components/auth-activity-tracker";
import { isAdminIdentity } from "@/lib/admin";
import { getCurrentAccount } from "@/lib/auth";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  display: "swap",
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  applicationName: siteName,
  title: {
    default: "AI Clipper, Video & Image Generator | Editing App",
    template: "%s | Editing App",
  },
  description: siteDescription,
  keywords: [
    "AI clipper",
    "AI video generator",
    "AI image generator",
    "AI ad creative generator",
    "product URL to video",
    "long video to shorts",
    "AI background remover",
  ],
  metadataBase: getSiteUrl(),
  alternates: { canonical: "/" },
  creator: siteName,
  publisher: siteName,
  category: "technology",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    title: "AI Clipper, Video & Image Generator | Editing App",
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Clipper, Video & Image Generator | Editing App",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: googleSiteVerification ? { google: googleSiteVerification } : undefined,
  referrer: "origin-when-cross-origin",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const current = await getCurrentAccount();
  const account = current
    ? {
        avatarUrl: current.profile?.avatar_url ?? null,
        displayName: current.profile?.display_name || current.user.email?.split("@")[0] || "Creator",
        email: current.user.email ?? "",
        isAdmin: isAdminIdentity(current.user),
        username: current.profile?.username ?? `creator_${current.user.id.slice(0, 6)}`,
      }
    : null;
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": new URL("/#organization", siteUrl).toString(),
        name: siteName,
        url: siteUrl.toString(),
        logo: new URL("/icon.svg", siteUrl).toString(),
        knowsAbout: [
          "AI video clipping",
          "AI video generation",
          "AI image generation",
          "Ecommerce video ads",
          "Long video repurposing",
          "Image background removal",
        ],
      },
      {
        "@type": "WebSite",
        "@id": new URL("/#website", siteUrl).toString(),
        name: siteName,
        url: siteUrl.toString(),
        description: siteDescription,
        publisher: { "@id": new URL("/#organization", siteUrl).toString() },
        inLanguage: "en",
      },
    ],
  };
  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
        <SiteHeader account={account} />
        {account ? <AuthActivityTracker /> : null}
        {children}
      </body>
    </html>
  );
}
