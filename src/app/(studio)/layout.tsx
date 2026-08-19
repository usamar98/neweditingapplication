import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getCurrentAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default async function PublicStudioLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();
  if (!account) return children;

  return (
    <AppShell
      account={{
        avatarUrl: account.profile?.avatar_url ?? null,
        email: account.user.email ?? "Creator",
        name: account.profile?.display_name || account.profile?.username || "Creator",
        plan: account.profile?.plan ?? "starter",
      }}
    >
      {children}
    </AppShell>
  );
}
