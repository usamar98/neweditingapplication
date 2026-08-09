import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/site-header";
import { getCurrentAccount } from "@/lib/auth";
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
  title: {
    default: "Editing App — AI creative studio",
    template: "%s · Editing App",
  },
  description:
    "Edit footage and create production-ready AI videos and images in one private creative workspace.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body>
        <TooltipProvider>
          <SiteHeader account={account} />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
