import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/site-header";
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

export const metadata: Metadata = {
  applicationName: siteName,
  title: {
    default: "Editing App — AI video editor and creative studio",
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
    title: "Editing App — AI video editor and creative studio",
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Editing App — AI video editor and creative studio",
    description: siteDescription,
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const current = await getCurrentAccount();
  const account = current
    ? {
        avatarUrl: current.profile?.avatar_url ?? null,
        displayName: current.profile?.display_name || current.user.email?.split("@")[0] || "Creator",
        email: current.user.email ?? "",
        username: current.profile?.username ?? `creator_${current.user.id.slice(0, 6)}`,
      }
    : null;
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
      <body>
        <TooltipProvider>
          <SiteHeader account={account} />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
