import { z } from "zod";

export const billingPlanKeys = ["creator", "studio", "business"] as const;
export const billingPlanKeySchema = z.enum(billingPlanKeys);
export type BillingPlanKey = z.infer<typeof billingPlanKeySchema>;

export const billingPlans = [
  {
    amountCents: 2_999,
    credits: "1,500",
    description: "For individual creators building a consistent weekly content engine.",
    features: [
      "AI Clipper, separate video and image generators, and background remover",
      "720p and 1080p video where the selected model supports it",
      "All efficient models plus premium model access",
      "Indicative capacity: ~3 min efficient video or ~30 sec premium video",
    ],
    key: "creator" as const,
    name: "Creator",
    price: "$29.99",
  },
  {
    amountCents: 4_999,
    credits: "3,500",
    description: "For brands and agencies producing premium creative every week.",
    features: [
      "Everything in Creator, with a larger monthly generation budget",
      "Seedance 2.5, LTX 2.3 Pro, Veo 3.1, and Kling 3 Pro",
      "Native 4K generation on supported models",
      "Indicative capacity: ~7 min efficient video or ~1 min premium video",
      "Performance Creative Studio for product URLs and long videos",
    ],
    key: "studio" as const,
    name: "Studio",
    popular: true,
    price: "$49.99",
  },
  {
    amountCents: 9_999,
    credits: "8,000",
    description: "For high-volume teams running a serious creative pipeline.",
    features: [
      "Everything in Studio with the largest generation budget",
      "Native 4K generation on supported premium models",
      "Long-form Seedance shots up to 30 seconds per generation",
      "Indicative capacity: ~16 min efficient video or ~2.5 min premium video",
      "Private masters and visible model-routing records",
    ],
    key: "business" as const,
    name: "Business",
    price: "$99.99",
  },
] as const;

export function getBillingPlan(plan: BillingPlanKey) {
  return billingPlans.find((candidate) => candidate.key === plan)!;
}
