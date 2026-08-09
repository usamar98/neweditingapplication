import { AppShell } from "@/components/app-shell";
import { getCurrentAccount, requireUser } from "@/lib/auth";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const account = await getCurrentAccount();
  return (
    <AppShell
      account={{
        avatarUrl: account?.profile?.avatar_url ?? null,
        email: user.email ?? "Creator",
        name: account?.profile?.display_name || account?.profile?.username || "Creator",
        plan: account?.profile?.plan ?? "starter",
      }}
    >
      {children}
    </AppShell>
  );
}
