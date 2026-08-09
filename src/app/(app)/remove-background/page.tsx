import { BackgroundRemover } from "@/components/background-remover";
import { requireUser } from "@/lib/auth";
import { listGenerations } from "@/lib/data/generations";

export const metadata = { title: "Background Remover" };

export default async function BackgroundRemoverPage() {
  const user = await requireUser();
  const generations = await listGenerations("background_removal");
  return <BackgroundRemover initialGenerations={generations} userId={user.id} />;
}
