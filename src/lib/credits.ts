import "server-only";

import {
  compatibleVideoEndpoints,
  endpointForAgent,
  endpointForEditorAgent,
  endpointForPerformanceCreativeAgent,
  type EditorAgentId,
} from "@/lib/domain/ai-models";
import type {
  BillingJobMetadata,
  GenerationRequest,
} from "@/lib/domain/generation";
import {
  WELCOME_IMAGE_AGENT_ID,
  WELCOME_IMAGE_CREDIT_COST,
  WELCOME_IMAGE_PROFILE,
} from "@/lib/domain/credits";
import { HttpError } from "@/lib/http";
import { getPlanForStripeSubscription, getStripe } from "@/lib/stripe";
import type { Database, Json } from "@/types/database.generated";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveFalModel } from "../../worker/providers/fal/routing";

export const CREDIT_PRICING_VERSION = "2026-08-15";
const CREDIT_MARKUP_BASIS_POINTS = 12_500;
const MICROS_PER_CENT = 10_000;

export type CreditQuote = BillingJobMetadata & {
  operationKey: string;
};

export function billingMetadataForQuote(value: CreditQuote): BillingJobMetadata {
  return {
    credits: value.credits,
    estimatedProviderCostMicros: value.estimatedProviderCostMicros,
    modelKey: value.modelKey,
    pricingVersion: value.pricingVersion,
    primaryEndpoint: value.primaryEndpoint,
    ...(value.secondaryEndpoint ? { secondaryEndpoint: value.secondaryEndpoint } : {}),
    ...(value.secondaryModel ? { secondaryModel: value.secondaryModel } : {}),
  };
}

export type CreditSummary = {
  accessMode: "none" | "paid" | "welcome";
  active: boolean;
  activeGenerations: number;
  allocatedCredits: number;
  canClaimWelcomeCredits: boolean;
  concurrencyLimit: number;
  consumedCredits: number;
  hourlyGenerationLimit: number;
  periodEnd: string | null;
  periodStart: string | null;
  plan: string | null;
  remainingCredits: number;
  reservedCredits: number;
  status: string | null;
  welcomeClaimed: boolean;
  welcomeImagesRemaining: number;
  welcomeRemainingCredits: number;
};

type ReservationResult = {
  accessMode?: "paid" | "welcome";
  concurrencyLimit?: number;
  creditsReserved: number;
  idempotent: boolean;
  remainingCredits?: number;
  reservationId: string;
};

function creditsForProviderCost(providerCostMicros: number, minimum = 1) {
  return Math.max(
    minimum,
    Math.ceil((providerCostMicros * CREDIT_MARKUP_BASIS_POINTS) / 10_000 / MICROS_PER_CENT),
  );
}

function durationSeconds(value: string) {
  return Number.parseInt(value, 10);
}

function quote(
  operationKey: string,
  modelKey: string,
  primaryEndpoint: string,
  estimatedProviderCostMicros: number,
  extra: Pick<BillingJobMetadata, "secondaryEndpoint" | "secondaryModel"> = {},
  minimumCredits = 1,
): CreditQuote {
  return {
    credits: creditsForProviderCost(estimatedProviderCostMicros, minimumCredits),
    estimatedProviderCostMicros: Math.ceil(estimatedProviderCostMicros),
    modelKey,
    operationKey,
    pricingVersion: CREDIT_PRICING_VERSION,
    primaryEndpoint,
    ...extra,
  };
}

const imageCostMicros: Record<string, number> = {
  "bytedance/seedream/v5/lite/text-to-image": 40_000,
  "bytedance/seedream/v5/pro/text-to-image": 135_000,
  "fal-ai/flux-2-max": 100_000,
  "fal-ai/flux-2/turbo": 35_000,
  "fal-ai/nano-banana-2": 80_000,
  "fal-ai/nano-banana-2/edit": 80_000,
  "fal-ai/recraft/v4.1/pro/text-to-image": 210_000,
};

function videoCostPerSecondMicros(endpoint: string, resolution: string, generateAudio: boolean) {
  if (endpoint === "fal-ai/veo3.1") {
    if (resolution === "4k") return generateAudio ? 600_000 : 400_000;
    return generateAudio ? 400_000 : 200_000;
  }
  if (endpoint === "fal-ai/veo3.1/fast" || endpoint === "fal-ai/veo3.1/fast/image-to-video") {
    if (resolution === "4k") return generateAudio ? 350_000 : 300_000;
    return generateAudio ? 150_000 : 100_000;
  }
  if (endpoint === "fal-ai/veo3.1/image-to-video") {
    if (resolution === "4k") return generateAudio ? 600_000 : 400_000;
    return generateAudio ? 400_000 : 200_000;
  }
  if (endpoint.startsWith("bytedance/seedance-2.5/")) return 310_000;
  if (endpoint === "fal-ai/ltx-2.3/text-to-video") return resolution === "4k" ? 320_000 : 80_000;
  if (endpoint === "fal-ai/kling-video/v3/pro/text-to-video") return generateAudio ? 220_000 : 170_000;
  return generateAudio ? 450_000 : 300_000;
}

function imageQuote(input: Extract<GenerationRequest, { kind: "image" }>) {
  const routing = resolveFalModel({
    capability: "text-to-image",
    preferredEndpointId: endpointForAgent("image", input.agentId),
    profile: input.profile,
  });
  return quote(
    "generate_image",
    routing.endpointId,
    routing.endpointId,
    imageCostMicros[routing.endpointId] ?? 120_000,
    {},
    4,
  );
}

function videoQuote(input: Extract<GenerationRequest, { kind: "video" }>) {
  const routing = resolveFalModel({
    capability: "text-to-video",
    compatibleEndpointIds: compatibleVideoEndpoints(input.duration, input.resolution),
    preferredEndpointId: endpointForAgent("video", input.agentId),
    profile: input.profile,
  });
  const providerCost = videoCostPerSecondMicros(
    routing.endpointId,
    input.resolution,
    input.generateAudio,
  ) * durationSeconds(input.duration);
  return quote("generate_video", routing.endpointId, routing.endpointId, providerCost, {}, 10);
}

function backgroundQuote(input: Extract<GenerationRequest, { kind: "background_removal" }>) {
  const routing = resolveFalModel({
    capability: "background-removal",
    preferredEndpointId: endpointForAgent("background_removal", input.agentId),
    profile: input.profile,
  });
  const providerCost = routing.endpointId === "fal-ai/birefnet/v2" ? 50_000 : 20_000;
  return quote("generate_background_removal", routing.endpointId, routing.endpointId, providerCost, {}, 3);
}

function performanceCreativeQuote(
  input: Extract<GenerationRequest, { kind: "performance_creative" }>,
  sourceDurationSeconds?: number | null,
) {
  if (input.source.type === "long_video") {
    const routing = resolveFalModel({
      capability: "video-understanding",
      preferredEndpointId: endpointForPerformanceCreativeAgent(input.agentId, "long_video", "video"),
      profile: input.profile,
    });
    const sourceMinutes = Math.max(1, Math.ceil((sourceDurationSeconds ?? 60) / 60));
    return quote(
      "generate_performance_creative",
      `${routing.endpointId}:long-video`,
      routing.endpointId,
      40_000 + sourceMinutes * 15_000,
      {},
      8,
    );
  }

  const strategy = resolveFalModel({ capability: "content-analysis", profile: input.profile });
  if (input.outputType === "image") {
    const capability = input.source.type === "product_url" ? "image-to-image" : "text-to-image";
    const image = resolveFalModel({
      capability,
      preferredEndpointId: endpointForPerformanceCreativeAgent(input.agentId, input.source.type, "image"),
      profile: input.profile,
    });
    const providerCost = 25_000 + (imageCostMicros[image.endpointId] ?? 120_000);
    return quote(
      "generate_performance_creative",
      `${image.endpointId}+${strategy.endpointId}:${strategy.model ?? "default"}`,
      image.endpointId,
      providerCost,
      { secondaryEndpoint: strategy.endpointId, secondaryModel: strategy.model },
      6,
    );
  }

  const video = resolveFalModel({
    capability: "image-to-video",
    preferredEndpointId: endpointForPerformanceCreativeAgent(input.agentId, "product_url", "video"),
    profile: input.profile,
  });
  const providerCost = 25_000 + videoCostPerSecondMicros(video.endpointId, "1080p", true) * 8;
  return quote(
    "generate_performance_creative",
    `${video.endpointId}+${strategy.endpointId}:${strategy.model ?? "default"}`,
    video.endpointId,
    providerCost,
    { secondaryEndpoint: strategy.endpointId, secondaryModel: strategy.model },
    15,
  );
}

export function quoteGenerationCredits(
  input: GenerationRequest,
  sourceDurationSeconds?: number | null,
): CreditQuote {
  if (input.kind === "image") return imageQuote(input);
  if (input.kind === "video") return videoQuote(input);
  if (input.kind === "background_removal") return backgroundQuote(input);
  return performanceCreativeQuote(input, sourceDurationSeconds);
}

export function quoteProjectCredits({
  agentId,
  durationSeconds: sourceDuration,
  kind,
}: {
  agentId?: EditorAgentId;
  durationSeconds: number;
  kind: "analyze" | "export";
}): CreditQuote {
  const minutes = Math.max(1, Math.ceil(sourceDuration / 60));
  if (kind === "export") {
    return {
      credits: Math.max(5, minutes * 5),
      estimatedProviderCostMicros: 0,
      modelKey: "local/ffmpeg-export",
      operationKey: "export",
      pricingVersion: CREDIT_PRICING_VERSION,
      primaryEndpoint: "local/ffmpeg-export",
    };
  }

  const preferred = endpointForEditorAgent(agentId ?? "auto");
  const analysis = preferred === "local"
    ? null
    : resolveFalModel({
        capability: "content-analysis",
        preferredModel: preferred,
        profile: "balanced",
      });
  const providerCost = minutes * 3_000 + (analysis ? 30_000 : 0);
  return quote(
    "analyze",
    `fal-ai/whisper+${analysis ? `${analysis.endpointId}:${analysis.model}` : "local-analysis"}`,
    "fal-ai/whisper",
    providerCost,
    analysis ? { secondaryEndpoint: analysis.endpointId, secondaryModel: analysis.model } : {},
    5,
  );
}

function creditError(error: { message?: string } | null) {
  const message = error?.message ?? "";
  if (message.includes("WELCOME_CREDITS_NOT_CLAIMED")) {
    return new HttpError(402, "Claim your 20 free image credits or choose a paid plan.", "WELCOME_CREDITS_NOT_CLAIMED");
  }
  if (message.includes("WELCOME_MODEL_RESTRICTED")) {
    return new HttpError(403, "Welcome credits can only use the default FLUX.2 Turbo image model.", "WELCOME_MODEL_RESTRICTED");
  }
  if (message.includes("SUBSCRIPTION_REQUIRED")) {
    return new HttpError(402, "An active paid subscription is required to start this operation.", "SUBSCRIPTION_REQUIRED");
  }
  if (message.includes("INSUFFICIENT_CREDITS")) {
    return new HttpError(402, "You do not have enough monthly credits for this operation.", "INSUFFICIENT_CREDITS");
  }
  if (message.includes("CONCURRENCY_LIMIT_REACHED")) {
    return new HttpError(429, "Your plan's simultaneous generation limit is already in use.", "CONCURRENCY_LIMIT_REACHED");
  }
  if (message.includes("GENERATION_LIMIT_REACHED")) {
    return new HttpError(429, "Your plan's hourly generation limit has been reached.", "GENERATION_LIMIT_REACHED");
  }
  return new HttpError(503, "The credit service is temporarily unavailable.", "CREDIT_SERVICE_UNAVAILABLE");
}

async function refreshStripeEntitlement(
  admin: SupabaseClient<Database>,
  userId: string,
) {
  const { data: billing } = await admin
    .from("billing_accounts")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  const stripe = getStripe();
  if (!stripe || !billing?.stripe_subscription_id) return false;

  const subscription = await stripe.subscriptions.retrieve(billing.stripe_subscription_id);
  const item = subscription.items.data[0];
  const priceId = item?.price.id ?? null;
  const plan = getPlanForStripeSubscription(subscription);
  const periodStart = item?.current_period_start
    ? new Date(item.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;
  const active = ["active", "trialing"].includes(subscription.status);
  const { error: billingError } = await admin.from("billing_accounts").update({
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: periodEnd,
    current_period_start: periodStart,
    plan_key: plan,
    stripe_price_id: priceId,
    subscription_status: subscription.status,
  }).eq("user_id", userId);
  if (billingError) return false;

  await admin.from("profiles").update({ plan: active && plan ? plan : "starter" }).eq("id", userId);
  if (!active || !plan || !periodStart || !periodEnd) return false;
  const { error: periodError } = await admin.rpc("sync_credit_period", {
    p_period_end: periodEnd,
    p_period_start: periodStart,
    p_plan_key: plan,
    p_user_id: userId,
  });
  return !periodError;
}

async function hasCurrentEntitlement(
  admin: SupabaseClient<Database>,
  userId: string,
) {
  const { data } = await admin
    .from("billing_accounts")
    .select("current_period_end,current_period_start,plan_key,subscription_status")
    .eq("user_id", userId)
    .maybeSingle();
  const now = Date.now();
  return Boolean(
    data
      && ["active", "trialing"].includes(data.subscription_status ?? "")
      && data.plan_key
      && data.plan_key !== "welcome"
      && data.current_period_start
      && data.current_period_end
      && Date.parse(data.current_period_start) <= now
      && Date.parse(data.current_period_end) > now,
  );
}

export type GenerationAccessMode = "paid" | "welcome";

export function generationRequestForAccess(
  input: GenerationRequest,
  accessMode: GenerationAccessMode,
): GenerationRequest {
  if (accessMode === "paid") return input;
  if (input.kind !== "image") {
    throw new HttpError(402, "A paid subscription is required for this feature.", "SUBSCRIPTION_REQUIRED");
  }
  return {
    ...input,
    agentId: WELCOME_IMAGE_AGENT_ID,
    profile: WELCOME_IMAGE_PROFILE,
  };
}

export async function requireGenerationAccess(
  admin: SupabaseClient<Database>,
  userId: string,
  kind: GenerationRequest["kind"],
): Promise<GenerationAccessMode> {
  if (await hasCurrentEntitlement(admin, userId)) return "paid";
  const refreshed = await refreshStripeEntitlement(admin, userId).catch(() => false);
  if (refreshed && await hasCurrentEntitlement(admin, userId)) return "paid";

  if (kind !== "image") {
    throw new HttpError(402, "An active paid subscription is required to use this feature.", "SUBSCRIPTION_REQUIRED");
  }

  const { data, error } = await admin
    .from("credit_accounts")
    .select("allocated_credits,consumed_credits,reserved_credits")
    .eq("user_id", userId)
    .eq("plan_key", "welcome")
    .maybeSingle();
  if (error) {
    throw new HttpError(503, "The welcome credit service is temporarily unavailable.", "CREDIT_SERVICE_UNAVAILABLE");
  }
  if (!data) {
    throw new HttpError(402, "Claim your 20 free image credits or choose a paid plan.", "WELCOME_CREDITS_NOT_CLAIMED");
  }
  const remaining = data.allocated_credits - data.reserved_credits - data.consumed_credits;
  if (remaining < WELCOME_IMAGE_CREDIT_COST) {
    throw new HttpError(402, "Your free image credits are used. Choose a plan to keep creating.", "INSUFFICIENT_CREDITS");
  }
  return "welcome";
}

export async function requireActiveSubscription(
  admin: SupabaseClient<Database>,
  userId: string,
) {
  if (await hasCurrentEntitlement(admin, userId)) return;
  const refreshed = await refreshStripeEntitlement(admin, userId).catch(() => false);
  if (!refreshed || !(await hasCurrentEntitlement(admin, userId))) {
    throw new HttpError(402, "An active paid subscription is required to use this feature.", "SUBSCRIPTION_REQUIRED");
  }
}

export async function reserveCredits(
  admin: SupabaseClient<Database>,
  input: {
    jobId: string;
    quote: CreditQuote;
    requestId: string;
    userId: string;
  },
) {
  const reserve = () => admin.rpc("reserve_job_credits", {
    p_credits: input.quote.credits,
    p_estimated_provider_cost_micros: input.quote.estimatedProviderCostMicros,
    p_idempotency_key: `job:${input.jobId}:${input.requestId}`,
    p_job_id: input.jobId,
    p_model_key: input.quote.modelKey,
    p_operation_key: input.quote.operationKey,
    p_pricing_version: input.quote.pricingVersion,
    p_user_id: input.userId,
  });
  let result = await reserve();
  if (result.error?.message.includes("SUBSCRIPTION_REQUIRED")) {
    const refreshed = await refreshStripeEntitlement(admin, input.userId).catch(() => false);
    if (refreshed) result = await reserve();
  }
  const { data, error } = result;
  if (error || !data) throw creditError(error);
  return data as unknown as ReservationResult;
}

export async function claimWelcomeCredits(
  admin: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await admin.rpc("claim_welcome_credits", { p_user_id: userId });
  if (error || !data) {
    throw new HttpError(503, "Unable to claim welcome credits right now.", "WELCOME_CLAIM_FAILED");
  }
  return data;
}

export async function failUnstartedJob(
  admin: SupabaseClient<Database>,
  jobId: string,
  errorCode: string,
  message: string,
  stage: string,
) {
  const { error } = await admin.rpc("fail_job_with_credits", {
    p_attempt: 0,
    p_error_code: errorCode,
    p_error_message: message,
    p_force_terminal: true,
    p_job_id: jobId,
    p_stage: stage,
  });
  if (error) throw new HttpError(503, "Unable to release the job's reserved credits.", "CREDIT_RELEASE_FAILED");
}

const creditSummaryDefaults: CreditSummary = {
  accessMode: "none",
  active: false,
  activeGenerations: 0,
  allocatedCredits: 0,
  canClaimWelcomeCredits: true,
  concurrencyLimit: 0,
  consumedCredits: 0,
  hourlyGenerationLimit: 0,
  periodEnd: null,
  periodStart: null,
  plan: null,
  remainingCredits: 0,
  reservedCredits: 0,
  status: null,
  welcomeClaimed: false,
  welcomeImagesRemaining: 0,
  welcomeRemainingCredits: 0,
};

export async function getCreditSummary(supabase: SupabaseClient<Database>): Promise<CreditSummary> {
  const { data, error } = await supabase.rpc("get_my_credit_summary");
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return creditSummaryDefaults;
  return { ...creditSummaryDefaults, ...(data as Json as Partial<CreditSummary>) };
}
