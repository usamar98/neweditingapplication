import "server-only";

import Stripe from "stripe";
import {
  billingPlanKeySchema,
  getBillingPlan,
  type BillingPlanKey,
} from "@/lib/domain/billing";

let stripeClient: Stripe | null | undefined;

export function getStripe() {
  if (stripeClient !== undefined) return stripeClient;
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  stripeClient = secretKey
    ? new Stripe(secretKey, { apiVersion: "2026-07-29.dahlia", appInfo: { name: "Editing App" } })
    : null;
  return stripeClient;
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function getStripePriceId(plan: BillingPlanKey) {
  const prices: Record<BillingPlanKey, string | undefined> = {
    business: process.env.STRIPE_PRICE_BUSINESS,
    creator: process.env.STRIPE_PRICE_CREATOR,
    studio: process.env.STRIPE_PRICE_STUDIO,
  };
  return prices[plan]?.trim() || null;
}

export function getPlanForStripePrice(priceId: string): BillingPlanKey | null {
  for (const plan of ["creator", "studio", "business"] as const) {
    if (getStripePriceId(plan) === priceId) return plan;
  }
  return null;
}

export function getPlanForStripeSubscription(subscription: Stripe.Subscription): BillingPlanKey | null {
  const item = subscription.items.data[0];
  const metadataPlan = billingPlanKeySchema.safeParse(subscription.metadata.plan);

  if (metadataPlan.success) {
    const expectedPlan = getBillingPlan(metadataPlan.data);
    const price = item?.price;
    const matchesServerPrice = price?.currency.toLowerCase() === "usd"
      && price.unit_amount === expectedPlan.amountCents
      && price.recurring?.interval === "month"
      && (price.recurring.interval_count ?? 1) === 1;
    return matchesServerPrice ? metadataPlan.data : null;
  }

  // Keep recognizing subscriptions created before inline pricing was enabled.
  return item?.price.id ? getPlanForStripePrice(item.price.id) : null;
}

export function isStripeConfigured() {
  return Boolean(getStripe() && getStripeWebhookSecret());
}

export function getAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS outside local development.");
  }
  return url.origin;
}
