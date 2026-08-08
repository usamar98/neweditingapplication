import { GenerationStudio } from "@/components/generation-studio";
import { requireUser } from "@/lib/auth";
import { listGenerations } from "@/lib/data/generations";

export const metadata = { title: "AI Video Generator" };

export default async function VideoGeneratorPage() {
  await requireUser();
  const generations = await listGenerations("video");
  return <GenerationStudio kind="video" initialGenerations={generations} />;
}
