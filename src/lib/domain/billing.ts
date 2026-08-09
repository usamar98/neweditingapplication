import { z } from "zod";

export const billingPlanKeys = ["creator", "studio", "business"] as const;
export const billingPlanKeySchema = z.enum(billingPlanKeys);
export type BillingPlanKey = z.infer<typeof billingPlanKeySchema>;

export const billingPlans = [
  {
    description: "A focused creative workspace for individual creators.",
    key: "creator" as const,
    name: "Creator",
    price: "$29.99",
  },
  {
    description: "A faster production workflow for frequent publishing.",
    key: "studio" as const,
    name: "Studio",
    popular: true,
    price: "$49.99",
  },
  {
    description: "A larger workspace for serious production teams.",
    key: "business" as const,
    name: "Business",
    price: "$99.99",
  },
] as const;
