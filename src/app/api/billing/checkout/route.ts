import { billingPlanKeySchema } from "@/lib/domain/billing";
import { errorResponse, getRequestId, HttpError } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl, getStripe, getStripePriceId } from "@/lib/stripe";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const { plan } = billingPlanKeySchema
      .transform((value) => ({ plan: value }))
      .parse((await request.json() as { plan?: unknown }).plan);
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new HttpError(401, "Sign in before choosing a plan.", "UNAUTHENTICATED");

    const stripe = getStripe();
    const priceId = getStripePriceId(plan);
    if (!stripe || !priceId) throw new HttpError(503, "Stripe billing is not configured yet.", "BILLING_NOT_CONFIGURED");

    const admin = createAdminClient();
    const { data: billing } = await admin
      .from("billing_accounts")
      .select("stripe_customer_id,stripe_subscription_id,subscription_status")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (billing?.stripe_subscription_id && ["active", "trialing", "past_due", "unpaid"].includes(billing.subscription_status ?? "")) {
      throw new HttpError(409, "You already have a subscription. Manage or change it from Account.", "SUBSCRIPTION_EXISTS");
    }

    let customerId = billing?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: authData.user.email,
        metadata: { supabase_user_id: authData.user.id },
      }, { idempotencyKey: `editing-app-customer-${authData.user.id}` });
      customerId = customer.id;
      const { error } = await admin.from("billing_accounts").upsert({
        stripe_customer_id: customerId,
        user_id: authData.user.id,
      });
      if (error) throw new HttpError(500, "Unable to connect the billing profile.", "BILLING_PROFILE_FAILED");
    }

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      cancel_url: `${appUrl}/#pricing`,
      client_reference_id: authData.user.id,
      consent_collection: { terms_of_service: "required" },
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { plan, supabase_user_id: authData.user.id },
      mode: "subscription",
      subscription_data: { metadata: { plan, supabase_user_id: authData.user.id } },
      success_url: `${appUrl}/account?billing=success`,
    }, { idempotencyKey: `checkout-${authData.user.id}-${plan}-${requestId}` });
    if (!session.url) throw new HttpError(502, "Stripe did not return a checkout URL.", "CHECKOUT_URL_MISSING");
    return Response.json({ url: session.url });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
