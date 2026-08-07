import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell email={user.email ?? "Creator"}>{children}</AppShell>;
}
