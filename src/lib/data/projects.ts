import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";
import {
  defaultEditSettings,
  editSettingsSchema,
  emptyAnalysis,
  emptyTranscript,
  type Transcript,
  type VideoAnalysis,
  VIDEO_ASSET_BUCKET,
  VIDEO_OUTPUT_BUCKET,
  VIDEO_SOURCE_BUCKET,
} from "@/lib/domain/video";
import { getSignedUrlTtl } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/types/database.generated";

export type ProjectListItem = Pick<
  Tables<"projects">,
  | "created_at"
  | "duration_seconds"
  | "id"
  | "name"
  | "source_filename"
  | "source_size_bytes"
  | "status"
  | "thumbnail_path"
  | "updated_at"
>;

export type ProjectEditorData = {
  analysis: VideoAnalysis;
  createdAt: string;
  duration: number;
  editSettings: typeof defaultEditSettings;
  exportUrl: string | null;
  id: string;
  jobs: Tables<"jobs">[];
  lastError: string | null;
  name: string;
  previewUrl: string;
  sourceFilename: string;
  sourceReady: boolean;
  status: Tables<"projects">["status"];
  thumbnailUrl: string | null;
  transcript: Transcript;
};

export const listProjects = cache(async (): Promise<ProjectListItem[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id,name,status,source_filename,source_size_bytes,duration_seconds,thumbnail_path,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Unable to load projects: ${error.message}`);
  }

  return data;
});

function asTranscript(value: Json): Transcript {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyTranscript;
  }
  return value as unknown as Transcript;
}

function asAnalysis(value: Json): VideoAnalysis {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyAnalysis;
  }
  return value as unknown as VideoAnalysis;
}

export const getProjectEditorData = cache(
  async (projectId: string): Promise<ProjectEditorData> => {
    const supabase = await createClient();
    const [{ data: project, error }, { data: jobs, error: jobsError }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabase
        .from("jobs")
        .select("*")
        .eq("project_id", projectId)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (error || jobsError) {
      throw new Error(error?.message ?? jobsError?.message ?? "Unable to load project");
    }
    if (!project) {
      notFound();
    }

    const sourceReady = Number(project.source_size_bytes) > 1 || Number(project.duration_seconds ?? 0) > 0;
    const ttl = getSignedUrlTtl();
    const signedRequests = [
      sourceReady
        ? supabase.storage.from(VIDEO_SOURCE_BUCKET).createSignedUrl(project.source_path, ttl)
        : Promise.resolve({ data: null, error: null }),
      project.export_path
        ? supabase.storage.from(VIDEO_OUTPUT_BUCKET).createSignedUrl(project.export_path, ttl)
        : Promise.resolve({ data: null, error: null }),
      project.thumbnail_path
        ? supabase.storage.from(VIDEO_ASSET_BUCKET).createSignedUrl(project.thumbnail_path, ttl)
        : Promise.resolve({ data: null, error: null }),
    ] as const;
    const [sourceSigned, exportSigned, thumbnailSigned] = await Promise.all(signedRequests);

    return {
      analysis: asAnalysis(project.analysis),
      createdAt: project.created_at,
      duration: Number(project.duration_seconds ?? 0),
      editSettings: editSettingsSchema.catch(defaultEditSettings).parse(project.edit_settings),
      exportUrl: exportSigned.data?.signedUrl ?? null,
      id: project.id,
      jobs: jobs ?? [],
      lastError: project.last_error,
      name: project.name,
      previewUrl: sourceSigned.data?.signedUrl ?? "",
      sourceFilename: project.source_filename,
      sourceReady,
      status: project.status,
      thumbnailUrl: thumbnailSigned.data?.signedUrl ?? null,
      transcript: asTranscript(project.transcript),
    };
  },
);
