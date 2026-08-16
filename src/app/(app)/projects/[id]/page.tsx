import { z } from "zod";
import { AIClipper } from "@/components/ai-clipper";
import { requireUser } from "@/lib/auth";
import { getProjectEditorData } from "@/lib/data/projects";

export const metadata = { title: "AI Clipper" };

export default async function ProjectPage(props: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await props.params;
  z.string().uuid().parse(id);
  const project = await getProjectEditorData(id);
  return <AIClipper project={project} />;
}
