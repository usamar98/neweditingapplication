import { GenerationStudio } from "@/components/generation-studio";
import { getCurrentUser } from "@/lib/auth";
import { getCreditSummary } from "@/lib/credits";
import { listGenerations } from "@/lib/data/generations";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "AI Video Generator" };

export default async function VideoGeneratorPage() {
  const user = await getCurrentUser();
  const [generations, credits] = user
    ? await Promise.all([
        listGenerations("video"),
        createClient().then(getCreditSummary),
      ])
    : [[], null];

  return (
    <GenerationStudio
      initialCredits={credits}
      initialGenerations={generations}
      isAuthenticated={Boolean(user)}
      kind="video"
    />
  );
}
