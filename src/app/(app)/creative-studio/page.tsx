import { PerformanceCreativeStudio } from "@/components/performance-creative-studio";
import { PaidFeatureGate } from "@/components/paid-feature-gate";
import { requireUser } from "@/lib/auth";
import { listGenerations } from "@/lib/data/generations";
import { listProjects } from "@/lib/data/projects";

export const metadata = { title: "AI Ad Creative Generator" };

export default async function CreativeStudioPage() {
  const user = await requireUser();
  const [generations, projects] = await Promise.all([
    listGenerations("performance_creative"),
    listProjects(),
  ]);
  return <PaidFeatureGate userId={user.id}><PerformanceCreativeStudio initialGenerations={generations} projects={projects} /></PaidFeatureGate>;
}
