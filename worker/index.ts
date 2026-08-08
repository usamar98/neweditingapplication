import { mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { queueMessageSchema, type QueueMessage } from "../src/lib/domain/video";
import type { Database, Json, Tables } from "../src/types/database.generated";
import { getWorkerConfig } from "./config";
import { runGenerationPipeline } from "./generation-pipeline";
import { workerLogger } from "./logger";
import { runPipeline, type ProgressReporter } from "./pipeline";
import { ProcessError } from "./process";

type QueueRow = Database["public"]["Functions"]["dequeue_video_jobs"]["Returns"][number];
type Job = Tables<"jobs">;
type Project = Tables<"projects">;
type Generation = Tables<"generations">;
type WorkTarget =
  | { type: "project"; project: Project }
  | { type: "generation"; generation: Generation };

const config = getWorkerConfig();
const supabase = createClient<Database>(
  config.WORKER_SUPABASE_URL,
  config.WORKER_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "x-application-name": "scene-forge-worker" } },
  },
);
let stopping = false;

function delay(milliseconds: number) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function errorDetails(error: unknown) {
  if (error instanceof ProcessError) {
    return {
      code: "FFMPEG_PROCESS_ERROR",
      message: `${error.message}: ${error.stderr.slice(-500)}`.slice(0, 1000),
    };
  }
  return {
    code: "VIDEO_PIPELINE_ERROR",
    message: (error instanceof Error ? error.message : "Unknown worker error").slice(0, 1000),
  };
}

async function archiveMessage(messageId: number) {
  const { data, error } = await supabase.rpc("archive_video_job", { message_id: messageId });
  if (error || !data) {
    workerLogger.error({ error: error?.message, messageId }, "Unable to archive queue message");
    return false;
  }
  return true;
}

function createReporter(jobId: string): ProgressReporter {
  let lastProgress = -1;
  let lastStage = "";
  let lastWriteAt = 0;
  let writeChain = Promise.resolve();

  return async (stage, rawProgress) => {
    const progress = Math.max(0, Math.min(100, Math.round(rawProgress)));
    const now = Date.now();
    if (
      stage === lastStage
      && progress < 100
      && progress - lastProgress < 2
      && now - lastWriteAt < 1000
    ) return;
    lastProgress = progress;
    lastStage = stage;
    lastWriteAt = now;
    writeChain = writeChain.then(async () => {
      const { error } = await supabase.from("jobs").update({ progress, stage }).eq("id", jobId);
      if (error) workerLogger.warn({ error: error.message, jobId }, "Unable to publish job progress");
    });
    await writeChain;
  };
}

async function getJobAndTarget(message: QueueMessage): Promise<{ job: Job; target: WorkTarget }> {
  let jobQuery = supabase
    .from("jobs")
    .select("*")
    .eq("id", message.jobId)
    .eq("user_id", message.userId);
  jobQuery = "projectId" in message
    ? jobQuery.eq("project_id", message.projectId)
    : jobQuery.eq("generation_id", message.generationId);
  const { data: job, error: jobError } = await jobQuery.single();
  if (jobError || !job) throw new Error(`Queue job does not match a database record: ${jobError?.message ?? "not found"}`);

  if ("projectId" in message) {
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", message.projectId)
      .eq("user_id", message.userId)
      .single();
    if (error || !project) throw new Error(`Queue project does not exist: ${error?.message ?? "not found"}`);
    return { job, target: { type: "project", project } };
  }

  const { data: generation, error } = await supabase
    .from("generations")
    .select("*")
    .eq("id", message.generationId)
    .eq("user_id", message.userId)
    .single();
  if (error || !generation) throw new Error(`Queue generation does not exist: ${error?.message ?? "not found"}`);
  return { job, target: { type: "generation", generation } };
}

async function markJobStarted(job: Job) {
  const attempt = job.attempt + 1;
  const { error } = await supabase.from("jobs").update({
    attempt,
    error_code: null,
    error_message: null,
    progress: 1,
    stage: "Worker claimed job",
    started_at: new Date().toISOString(),
    status: "processing",
  }).eq("id", job.id);
  if (error) throw new Error(`Unable to claim job: ${error.message}`);
  return attempt;
}

async function markJobComplete(job: Job, result: Json) {
  const completionStage: Record<Job["kind"], string> = {
    analyze: "Analysis complete",
    export: "Export complete",
    generate_image: "Image ready",
    generate_video: "Video ready",
  };
  const { error } = await supabase.from("jobs").update({
    error_code: null,
    error_message: null,
    finished_at: new Date().toISOString(),
    progress: 100,
    result,
    stage: completionStage[job.kind],
    status: "completed",
  }).eq("id", job.id);
  if (error) throw new Error(`Unable to complete job: ${error.message}`);
}

async function markJobFailed(job: Job, target: WorkTarget, attempt: number, error: unknown) {
  const details = errorDetails(error);
  const exhausted = attempt >= job.max_attempts;
  const { error: jobError } = await supabase.from("jobs").update({
    error_code: details.code,
    error_message: details.message,
    finished_at: exhausted ? new Date().toISOString() : null,
    progress: 0,
    stage: exhausted ? "Processing failed" : `Retry scheduled (${attempt}/${job.max_attempts})`,
    status: exhausted ? "failed" : "retrying",
  }).eq("id", job.id);
  if (jobError) workerLogger.error({ error: jobError.message, jobId: job.id }, "Unable to persist job failure");

  if (target.type === "project") {
    const { error: projectError } = await supabase.from("projects").update({
      last_error: details.message,
      ...(exhausted ? { status: "failed" as const } : {}),
    }).eq("id", target.project.id);
    if (projectError) workerLogger.error({ error: projectError.message, projectId: target.project.id }, "Unable to persist project failure");
  } else {
    const { error: generationError } = await supabase.from("generations").update({
      last_error: details.message,
      status: exhausted ? "failed" : "retrying",
    }).eq("id", target.generation.id);
    if (generationError) workerLogger.error({ error: generationError.message, generationId: target.generation.id }, "Unable to persist generation failure");
  }
  return { details, exhausted };
}

async function markTargetStarted(job: Job, target: WorkTarget) {
  if (target.type === "project") {
    const { error } = await supabase.from("projects").update({
      last_error: null,
      status: job.kind === "analyze" ? "analyzing" : "exporting",
    }).eq("id", target.project.id);
    if (error) throw new Error(`Unable to update project state: ${error.message}`);
    return;
  }

  const { error } = await supabase.from("generations").update({
    last_error: null,
    status: "processing",
  }).eq("id", target.generation.id);
  if (error) throw new Error(`Unable to update generation state: ${error.message}`);
}

async function processQueueRow(row: QueueRow) {
  const parsed = queueMessageSchema.safeParse(row.message);
  if (!parsed.success) {
    workerLogger.error({ issues: parsed.error.issues, messageId: row.msg_id }, "Archiving malformed queue message");
    await archiveMessage(row.msg_id);
    return;
  }

  let job: Job | undefined;
  let target: WorkTarget | undefined;
  let attempt = 0;
  let tempDir: string | undefined;
  const log = workerLogger.child({
    jobId: parsed.data.jobId,
    messageId: row.msg_id,
    targetId: "projectId" in parsed.data ? parsed.data.projectId : parsed.data.generationId,
    targetType: "projectId" in parsed.data ? "project" : "generation",
    queueReadCount: row.read_ct,
    userId: parsed.data.userId,
  });

  try {
    const records = await getJobAndTarget(parsed.data);
    job = records.job;
    target = records.target;
    if (["completed", "cancelled"].includes(job.status)) {
      log.info({ status: job.status }, "Archiving already terminal job");
      await archiveMessage(row.msg_id);
      return;
    }
    if (job.status === "failed" && job.attempt >= job.max_attempts) {
      await archiveMessage(row.msg_id);
      return;
    }

    attempt = await markJobStarted(job);
    await markTargetStarted(job, target);
    tempDir = await mkdtemp(resolve(config.WORKER_TEMP_ROOT, `${job.id}-`));
    log.info({ attempt, kind: job.kind }, "Starting media job");
    const result = target.type === "project"
      ? await runPipeline({
          config,
          job: { ...job, attempt },
          project: target.project,
          report: createReporter(job.id),
          supabase,
          tempDir,
        })
      : await runGenerationPipeline({
          config,
          generation: target.generation,
          job: { ...job, attempt },
          report: createReporter(job.id),
          supabase,
          tempDir,
        });
    await markJobComplete(job, result);
    await archiveMessage(row.msg_id);
    log.info({ attempt, kind: job.kind }, "Media job completed");
  } catch (error) {
    if (!job || !target) {
      log.error({ error }, "Queue message could not be matched to a job; archiving poison message");
      await archiveMessage(row.msg_id);
      return;
    }
    const failure = await markJobFailed(job, target, attempt || job.attempt + 1, error);
    log.error({ attempt, error, retrying: !failure.exhausted }, failure.details.message);
    if (failure.exhausted) await archiveMessage(row.msg_id);
  } finally {
    if (tempDir) {
      await rm(tempDir, { force: true, recursive: true }).catch((error) => {
        log.warn({ error, tempDir }, "Unable to clean job temporary directory");
      });
    }
  }
}

async function cleanupStaleTemporaryFiles() {
  const root = resolve(config.WORKER_TEMP_ROOT);
  await mkdir(root, { recursive: true });
  const cutoff = Date.now() - config.WORKER_TEMP_MAX_AGE_HOURS * 60 * 60 * 1000;
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = resolve(root, entry.name);
    if (!child.startsWith(`${root}${sep}`)) continue;
    const childStat = await stat(child);
    if (childStat.mtimeMs < cutoff) {
      await rm(child, { force: true, recursive: true });
      workerLogger.info({ child }, "Removed stale worker temporary directory");
    }
  }
}

async function poll() {
  while (!stopping) {
    try {
      const { data, error } = await supabase.rpc("dequeue_video_jobs", {
        batch_size: 1,
        visibility_timeout: config.WORKER_VISIBILITY_TIMEOUT_SECONDS,
      });
      if (error) throw new Error(`Unable to read Supabase Queue: ${error.message}`);
      const row = data?.[0];
      if (row) await processQueueRow(row);
      else await delay(config.WORKER_POLL_INTERVAL_MS);
    } catch (error) {
      workerLogger.error({ error }, "Worker poll failed");
      await delay(Math.min(config.WORKER_POLL_INTERVAL_MS * 2, 30000));
    }
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    stopping = true;
    workerLogger.info({ signal }, "Worker will stop after the current poll or job");
  });
}

async function main() {
  await cleanupStaleTemporaryFiles();
  workerLogger.info({ pollIntervalMs: config.WORKER_POLL_INTERVAL_MS }, "Video worker started");
  await poll();
  workerLogger.info("Video worker stopped");
}

main().catch((error) => {
  workerLogger.fatal({ error }, "Video worker failed to start");
  process.exitCode = 1;
});
