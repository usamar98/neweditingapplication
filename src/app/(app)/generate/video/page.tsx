import { GenerationStudio } from "@/components/generation-studio";
import { PaidFeatureGate } from "@/components/paid-feature-gate";
import { requireUser } from "@/lib/auth";
import { listGenerations } from "@/lib/data/generations";

export const metadata = { title: "AI Video Generator" };

export default async function VideoGeneratorPage() {
  const user = await requireUser();
  const generations = await listGenerations("video");
  return <PaidFeatureGate userId={user.id}><GenerationStudio kind="video" initialGenerations={generations} /></PaidFeatureGate>;
}
