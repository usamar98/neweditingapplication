import { GenerationStudio } from "@/components/generation-studio";
import { PaidFeatureGate } from "@/components/paid-feature-gate";
import { requireUser } from "@/lib/auth";
import { listGenerations } from "@/lib/data/generations";

export const metadata = { title: "AI Image Generator" };

export default async function ImageGeneratorPage() {
  const user = await requireUser();
  const generations = await listGenerations("image");
  return <PaidFeatureGate userId={user.id}><GenerationStudio kind="image" initialGenerations={generations} /></PaidFeatureGate>;
}
