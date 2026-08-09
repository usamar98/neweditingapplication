import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/site-header";
import { AuthActivityTracker } from "@/components/auth-activity-tracker";
import { isAdminIdentity } from "@/lib/admin";
import { getCurrentAccount } from "@/lib/auth";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  applicationName: siteName,
  title: {
    default: "AI Video Editor & Generator | Editing App",
    template: "%s · Editing App",
  },
  description: siteDescription,
  metadataBase: getSiteUrl(),
  alternates: { canonical: "/" },
  keywords: [
    "AI video editor",
    "AI video generator",
    "AI image generator",
    "product URL to video ad",
    "long video to shorts",
    "background remover",
    "Seedance 2.5",
    "LTX 2.3",
    "Veo 3.1",
  ],
  creator: siteName,
  publisher: siteName,
  category: "technology",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    title: "AI Video Editor & Generator | Editing App",
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Video Editor & Generator | Editing App",
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
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
      <body>
        <TooltipProvider>
          <SiteHeader account={account} />
          {account ? <AuthActivityTracker /> : null}
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
