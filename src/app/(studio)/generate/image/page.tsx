import { GenerationStudio } from "@/components/generation-studio";
import { getCreditSummary } from "@/lib/credits";
import { getCurrentUser } from "@/lib/auth";
import { listGenerations } from "@/lib/data/generations";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "AI Image Generator" };

export default async function ImageGeneratorPage() {
  const user = await getCurrentUser();
  const [generations, credits] = user
    ? await Promise.all([
        listGenerations("image"),
        createClient().then(getCreditSummary),
      ])
    : [[], null];

  return (
    <GenerationStudio
      initialCredits={credits}
      initialGenerations={generations}
      isAuthenticated={Boolean(user)}
      kind="image"
    />
  );
}
