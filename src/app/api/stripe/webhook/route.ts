import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanForStripePrice, getStripe, getStripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

async function syncSubscription(subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const plan = priceId ? getPlanForStripePrice(priceId) : null;
  let userId = subscription.metadata.supabase_user_id || null;
  if (!userId) {
    const { data } = await admin
      .from("billing_accounts")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) throw new Error("Stripe subscription is missing its Supabase account mapping.");
  const { data: profile } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!profile) return;

  const { error } = await admin.from("billing_accounts").upsert({
    cancel_at_period_end: subscription.cancel_at_period_end,
    plan_key: plan,
    stripe_customer_id: customerId,
    stripe_price_id: priceId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    user_id: userId,
  });
  if (error) throw new Error(`Unable to persist subscription: ${error.message}`);

  const entitled = ["active", "trialing"].includes(subscription.status);
  const { error: profileError } = await admin
    .from("profiles")
    .update({ plan: entitled && plan ? plan : "starter" })
    .eq("id", userId);
  if (profileError) throw new Error(`Unable to update account plan: ${profileError.message}`);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret();
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !webhookSecret) return Response.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  if (!signature) return Response.json({ error: "Missing Stripe signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode === "subscription" && typeof session.subscription === "string") {
        await syncSubscription(await stripe.subscriptions.retrieve(session.subscription));
      }
    } else if (
      event.type === "customer.subscription.created"
      || event.type === "customer.subscription.updated"
      || event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(event.data.object);
    }
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
