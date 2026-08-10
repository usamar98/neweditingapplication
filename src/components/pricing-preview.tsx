import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Check, Coins, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { billingPlans } from "@/lib/domain/billing";
import { cn } from "@/lib/utils";

export function PricingPreview() {
  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        {billingPlans.map((plan) => (
          <Card key={plan.key} className={cn("relative border-border bg-card/70", "popular" in plan && plan.popular && "border-primary/35 bg-primary/[0.045] shadow-2xl shadow-primary/5 lg:-translate-y-3")}>
            {"popular" in plan && plan.popular ? <Badge className="absolute right-5 top-4 shadow-lg">Most popular</Badge> : null}
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
                {plan.features.map((feature) => <li key={feature} className="flex gap-2.5 text-sm leading-5 text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span>{feature}</span></li>)}
              </ul>
              <Button variant={"popular" in plan && plan.popular ? "default" : "outline"} className="mt-8 h-11 w-full" asChild>
                <Link href={`/pricing#${plan.key}` as Route}>View {plan.name} plan <ArrowRight className="size-4" /></Link>
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck className="size-3 text-primary" /> Secure Stripe-hosted checkout</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mx-auto mt-5 max-w-3xl text-center text-[11px] leading-5 text-muted-foreground">
        Video-minute estimates are planning guides, not fixed quotas. Actual credit use varies by model, duration, native audio, and resolution. Native 4K and maximum shot length appear only when the selected model supports them.
      </p>
      <p className="mx-auto mt-3 max-w-3xl text-center text-[11px] leading-5 text-muted-foreground">
        Plans renew monthly until cancelled. Review the <Link href="/legal/subscriptions-credits-refunds" className="font-medium text-foreground underline underline-offset-4">billing and refund policy</Link>.
      </p>
    </div>
  );
}
