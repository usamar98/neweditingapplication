import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PerformanceCreativeStudio } from "@/components/performance-creative-studio";
import { getCurrentUser } from "@/lib/auth";
import { getCreditSummary } from "@/lib/credits";
import { listGenerations } from "@/lib/data/generations";
import { listProjects } from "@/lib/data/projects";
import type { PerformanceCreativeOutputType } from "@/lib/domain/generation";
import { createClient } from "@/lib/supabase/server";

function parseFormat(format: string): PerformanceCreativeOutputType | null {
  return format === "image" || format === "video" ? format : null;
}

export async function generateMetadata({ params }: PageProps<"/creative-studio/[format]">): Promise<Metadata> {
  const outputType = parseFormat((await params).format);
  if (outputType === "image") {
    return {
      title: "AI Image Ad Creator",
      description: "Create platform-ready image ads from product URLs and local-business briefs.",
      robots: { follow: false, index: false },
    };
  }
  return {
    title: "AI Video Ad Creator",
    description: "Create platform-ready video ads from product URLs and analyzed long videos.",
    robots: { follow: false, index: false },
  };
}

export default async function CreativeStudioFormatPage({ params }: PageProps<"/creative-studio/[format]">) {
  const outputType = parseFormat((await params).format);
  if (!outputType) notFound();

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
      key={outputType}
      initialCredits={credits}
      initialGenerations={generations}
      initialOutputType={outputType}
      isAuthenticated={Boolean(user)}
      projects={projects}
    />
  );
}
