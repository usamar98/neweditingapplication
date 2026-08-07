import { z } from "zod";
import { VideoEditor } from "@/components/video-editor";
import { requireUser } from "@/lib/auth";
import { getProjectEditorData } from "@/lib/data/projects";

export const metadata = { title: "Video editor" };

export default async function ProjectPage(props: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await props.params;
  z.string().uuid().parse(id);
  const project = await getProjectEditorData(id);
  return <VideoEditor project={project} />;
}
