import "server-only";

import { cache } from "react";
import type { GenerationKind } from "@/lib/domain/generation";
import { getSignedUrlTtl } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.generated";

export type GenerationView = Tables<"generations"> & {
  job: Tables<"jobs"> | null;
  outputUrl: string | null;
};

async function signGeneration(
  generation: Tables<"generations">,
  job: Tables<"jobs"> | null,
): Promise<GenerationView> {
  if (!generation.output_bucket || !generation.output_path) {
    return { ...generation, job, outputUrl: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(generation.output_bucket)
    .createSignedUrl(generation.output_path, getSignedUrlTtl());
  if (error || !data) {
    throw new Error(`Unable to sign generated media: ${error?.message ?? "unknown error"}`);
  }
  return { ...generation, job, outputUrl: data.signedUrl };
}

export const listGenerations = cache(async (kind: GenerationKind): Promise<GenerationView[]> => {
  const supabase = await createClient();
  const [{ data: generations, error }, { data: jobs, error: jobsError }] = await Promise.all([
    supabase
      .from("generations")
      .select("*")
      .eq("kind", kind)
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("jobs")
      .select("*")
      .not("generation_id", "is", null)
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (error || jobsError) {
    throw new Error(error?.message ?? jobsError?.message ?? "Unable to load generations");
  }

  const latestJobs = new Map<string, Tables<"jobs">>();
  for (const job of jobs ?? []) {
    if (job.generation_id && !latestJobs.has(job.generation_id)) {
      latestJobs.set(job.generation_id, job);
    }
  }

  return Promise.all(
    (generations ?? []).map((generation) =>
      signGeneration(generation, latestJobs.get(generation.id) ?? null),
    ),
  );
});

export async function getGeneration(generationId: string): Promise<GenerationView | null> {
  const supabase = await createClient();
  const [{ data: generation, error }, { data: job, error: jobError }] = await Promise.all([
    supabase.from("generations").select("*").eq("id", generationId).is("dismissed_at", null).maybeSingle(),
    supabase
      .from("jobs")
      .select("*")
      .eq("generation_id", generationId)
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (error || jobError) {
    throw new Error(error?.message ?? jobError?.message ?? "Unable to load generation");
  }
  return generation ? signGeneration(generation, job ?? null) : null;
}
