import { PerformanceCreativeStudio } from "@/components/performance-creative-studio";
import { getCurrentUser } from "@/lib/auth";
import { getCreditSummary } from "@/lib/credits";
import { listGenerations } from "@/lib/data/generations";
import { listProjects } from "@/lib/data/projects";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "AI Ad Creative Generator" };

export default async function CreativeStudioPage() {
  const user = await getCurrentUser();
  const [generations, projects, credits] = user
    ? await Promise.all([
        listGenerations("performance_creative"),
        listProjects(),
        createClient().then(getCreditSummary),
      ])
    : [[], [], null];

  return (
    <PerformanceCreativeStudio
      initialCredits={credits}
      initialGenerations={generations}
      isAuthenticated={Boolean(user)}
      projects={projects}
    />
  );
}
