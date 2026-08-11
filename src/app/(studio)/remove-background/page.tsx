import { BackgroundRemover } from "@/components/background-remover";
import { getCurrentUser } from "@/lib/auth";
import { getCreditSummary } from "@/lib/credits";
import { listGenerations } from "@/lib/data/generations";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Background Remover" };

export default async function BackgroundRemoverPage() {
  const user = await getCurrentUser();
  const [generations, credits] = user
    ? await Promise.all([
        listGenerations("background_removal"),
        createClient().then(getCreditSummary),
      ])
    : [[], null];

  return (
    <BackgroundRemover
      initialCredits={credits}
      initialGenerations={generations}
      isAuthenticated={Boolean(user)}
      userId={user?.id ?? null}
    />
  );
}
