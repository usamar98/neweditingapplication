"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Coins, LoaderCircle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { billingPlans, type BillingPlanKey } from "@/lib/domain/billing";
import { cn } from "@/lib/utils";

export function PricingCards() {
  const router = useRouter();
  const [pending, setPending] = useState<BillingPlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(plan: BillingPlanKey) {
    setPending(plan);
    setError(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        body: JSON.stringify({ plan }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string }; url?: string } | null;
      if (response.status === 401) {
        router.push(`/login?mode=signup&next=${encodeURIComponent("/#pricing")}`);
        return;
      }
      if (!response.ok || !body?.url) throw new Error(body?.error?.message ?? "Checkout is unavailable.");
      window.location.assign(body.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is unavailable.");
      setPending(null);
    }
  }

  return (
    <div>
      {error && <Alert variant="destructive" className="mx-auto mb-5 max-w-2xl"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        {billingPlans.map((plan) => (
          <Card key={plan.key} className={cn("relative border-white/[0.08] bg-card/60", "popular" in plan && plan.popular && "border-primary/35 bg-primary/[0.045] shadow-2xl shadow-primary/5 lg:-translate-y-3")}>
            {"popular" in plan && plan.popular && <Badge className="absolute right-5 top-4 shadow-lg">Most popular</Badge>}
            <CardContent className="flex h-full flex-col p-6 sm:p-7">
              <h3 className="text-lg font-medium">{plan.name}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{plan.description}</p>
              <div className="mt-7 flex items-end gap-2"><span className="text-4xl font-semibold tracking-[-0.05em]">{plan.price}</span><span className="pb-1 text-xs text-muted-foreground">/ month</span></div>
              <div className="my-7 h-px bg-border" />
              <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.055] p-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Coins className="size-4" /></span>
                <div><p className="text-sm font-medium">{plan.credits} monthly credits</p><p className="mt-0.5 text-[11px] text-muted-foreground">Used by model, seconds, audio, and resolution</p></div>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm leading-5 text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span>{feature}</span></li>
                ))}
              </ul>
              <Button variant={"popular" in plan && plan.popular ? "default" : "outline"} className="mt-8 h-11 w-full" onClick={() => void checkout(plan.key)} disabled={pending !== null}>
                {pending === plan.key ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                {pending === plan.key ? "Opening Stripe…" : `Choose ${plan.name}`}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck className="size-3 text-primary" /> Secure Stripe-hosted checkout</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mx-auto mt-5 max-w-3xl text-center text-[11px] leading-5 text-muted-foreground">
        Video-minute estimates are planning guides, not fixed quotas. Actual credit use varies by model, duration, native audio, and resolution. 4K and maximum shot length appear only when the selected model supports them; Editing App does not advertise native 8K generation.
      </p>
    </div>
  );
}
