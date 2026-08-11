import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanForStripePrice, getStripe, getStripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

async function syncSubscription(subscription: Stripe.Subscription, paidInvoiceId?: string | null) {
  const admin = createAdminClient();
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const subscriptionItem = subscription.items.data[0];
  const currentPeriodStart = subscriptionItem?.current_period_start
    ? new Date(subscriptionItem.current_period_start * 1000).toISOString()
    : null;
  const currentPeriodEnd = subscriptionItem?.current_period_end
    ? new Date(subscriptionItem.current_period_end * 1000).toISOString()
    : null;
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
  if (!profile) return null;

  const { error } = await admin.from("billing_accounts").upsert({
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: currentPeriodEnd,
    current_period_start: currentPeriodStart,
    ...(paidInvoiceId ? { latest_paid_invoice_id: paidInvoiceId } : {}),
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

  if (entitled && plan && currentPeriodStart && currentPeriodEnd) {
    const { error: creditError } = await admin.rpc("sync_credit_period", {
      p_period_end: currentPeriodEnd,
      p_period_start: currentPeriodStart,
      p_plan_key: plan,
      p_user_id: userId,
    });
    if (creditError) throw new Error(`Unable to synchronize monthly credits: ${creditError.message}`);
  }

  return { currentPeriodEnd, currentPeriodStart, plan, userId };
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

async function recordPaidInvoice(event: Stripe.Event, invoice: Stripe.Invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");
  const synced = await syncSubscription(
    await stripe.subscriptions.retrieve(subscriptionId),
    invoice.id,
  );
  if (!synced || !synced.plan || !synced.currentPeriodStart || !synced.currentPeriodEnd) return;

  const admin = createAdminClient();
  const { error } = await admin.from("billing_revenue_events").insert({
    amount_paid_cents: invoice.amount_paid,
    currency: invoice.currency.toLowerCase(),
    paid_at: new Date((invoice.status_transitions.paid_at ?? event.created) * 1000).toISOString(),
    period_end: synced.currentPeriodEnd,
    period_start: synced.currentPeriodStart,
    plan_key: synced.plan,
    stripe_event_id: event.id,
    stripe_invoice_id: invoice.id,
    user_id: synced.userId,
  });
  if (error && error.code !== "23505") {
    throw new Error(`Unable to record paid invoice revenue: ${error.message}`);
  }
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
        await syncSubscription(
          await stripe.subscriptions.retrieve(session.subscription),
          typeof session.invoice === "string" && session.payment_status === "paid" ? session.invoice : null,
        );
      }
    } else if (
      event.type === "customer.subscription.created"
      || event.type === "customer.subscription.updated"
      || event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(event.data.object);
    } else if (event.type === "invoice.paid") {
      await recordPaidInvoice(event, event.data.object);
    } else if (event.type === "invoice.payment_failed") {
      const subscriptionId = invoiceSubscriptionId(event.data.object);
      if (subscriptionId) {
        await syncSubscription(await stripe.subscriptions.retrieve(subscriptionId));
      }
    }
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
