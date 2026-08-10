import { PerformanceCreativeStudio } from "@/components/performance-creative-studio";
import { requireUser } from "@/lib/auth";
import { listGenerations } from "@/lib/data/generations";
import { listProjects } from "@/lib/data/projects";

export const metadata = { title: "AI Ad Creative Generator" };

export default async function CreativeStudioPage() {
  await requireUser();
  const [generations, projects] = await Promise.all([
    listGenerations("performance_creative"),
    listProjects(),
  ]);
  return <PerformanceCreativeStudio initialGenerations={generations} projects={projects} />;
}
