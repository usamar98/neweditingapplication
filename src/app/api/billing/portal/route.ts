import { z } from "zod";
import { errorResponse, getRequestId, HttpError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl, getStripe } from "@/lib/stripe";

const requestSchema = z.object({ flow: z.enum(["manage", "cancel"]).default("manage") }).strict();

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const input = requestSchema.parse(await request.json().catch(() => ({})));
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new HttpError(401, "Sign in to manage billing.", "UNAUTHENTICATED");
    const { data: billing, error: billingError } = await supabase
      .from("billing_accounts")
      .select("stripe_customer_id,stripe_subscription_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (billingError || !billing?.stripe_customer_id) throw new HttpError(404, "No Stripe billing profile exists for this account.", "BILLING_PROFILE_NOT_FOUND");
    if (input.flow === "cancel" && !billing.stripe_subscription_id) throw new HttpError(404, "No subscription is available to cancel.", "SUBSCRIPTION_NOT_FOUND");

    const stripe = getStripe();
    if (!stripe) throw new HttpError(503, "Stripe billing is not configured yet.", "BILLING_NOT_CONFIGURED");
    const returnUrl = `${getAppUrl()}/account`;
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: returnUrl,
      ...(input.flow === "cancel" && billing.stripe_subscription_id
        ? {
            flow_data: {
              after_completion: { redirect: { return_url: returnUrl }, type: "redirect" as const },
              subscription_cancel: { subscription: billing.stripe_subscription_id },
              type: "subscription_cancel" as const,
            },
          }
        : {}),
    });
    return Response.json({ url: session.url });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
