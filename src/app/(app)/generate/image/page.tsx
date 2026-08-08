import { GenerationStudio } from "@/components/generation-studio";
import { requireUser } from "@/lib/auth";
import { listGenerations } from "@/lib/data/generations";

export const metadata = { title: "AI Image Generator" };

export default async function ImageGeneratorPage() {
  await requireUser();
  const generations = await listGenerations("image");
  return <GenerationStudio kind="image" initialGenerations={generations} />;
}
