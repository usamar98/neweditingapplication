import { redirect } from "next/navigation";
import { reactivateAccount } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentAccount, getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Reactivate account", robots: { index: false, follow: false } };

export default async function ReactivatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const account = await getCurrentAccount();
  if (account?.profile?.account_status !== "inactive") redirect("/clipper");
  return <main className="grid min-h-[calc(100vh-4rem)] place-items-center px-4"><Card className="w-full max-w-lg border-border bg-card/85"><CardContent className="p-8 text-center"><h1 className="text-2xl font-semibold">Your account is inactive</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your projects are still stored. Reactivate the account to return to your private workspace.</p><form action={reactivateAccount} className="mt-6"><Button type="submit" size="lg">Reactivate account</Button></form></CardContent></Card></main>;
}
