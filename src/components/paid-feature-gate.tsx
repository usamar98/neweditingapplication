import type { ReactNode } from "react";
import Link from "next/link";
import { CreditCard, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireActiveSubscription } from "@/lib/credits";
import { HttpError } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PaidFeatureGate({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  try {
    await requireActiveSubscription(createAdminClient(), userId);
    return children;
  } catch (error) {
    if (!(error instanceof HttpError) || error.code !== "SUBSCRIPTION_REQUIRED") throw error;
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center px-4 py-12 sm:px-6">
      <Card className="w-full border-primary/15 bg-card/80 shadow-2xl shadow-black/5">
        <CardContent className="p-7 text-center sm:p-10">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="size-5" /></span>
          <p className="mt-6 text-sm font-medium text-primary">Paid workspace feature</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Choose a plan to start creating</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">AI generation and media processing require an active Creator, Studio, or Business subscription. Every plan includes a monthly credit balance and protected concurrency limits.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild><Link href="/pricing"><CreditCard className="size-4" /> Compare plans</Link></Button><Button variant="outline" asChild><Link href="/account#billing">Check billing status</Link></Button></div>
        </CardContent>
      </Card>
    </main>
  );
}
