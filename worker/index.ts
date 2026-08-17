import { mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { queueMessageSchema, type QueueMessage } from "../src/lib/domain/video";
import type { Database, Json, Tables } from "../src/types/database.generated";
import { getWorkerConfig } from "./config";
import { runGenerationPipeline } from "./generation-pipeline";
import { workerFailureDetails } from "./failures";
import { workerLogger } from "./logger";
import { runPipeline, type ProgressReporter } from "./pipeline";

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
    global: { headers: { "x-application-name": "editing-app-worker" } },
  },
);
let stopping = false;

function delay(milliseconds: number) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
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
      const { error } = await supabase
        .from("jobs")
        .update({ progress, stage })
        .eq("id", jobId)
        .neq("status", "cancelled");
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

async function requireCreditReservation(jobId: string) {
  const { data, error } = await supabase
    .from("credit_reservations")
    .select("id,status")
    .eq("job_id", jobId)
    .maybeSingle();
  if (error || !data || data.status !== "reserved") {
    throw new Error("The job does not have an active subscription credit reservation.");
  }
}

async function markJobComplete(job: Job, result: Json) {
  const completionStage: Record<Job["kind"], string> = {
    analyze: "Analysis complete",
    export: "Export complete",
    generate_background_removal: "Background removed",
    generate_image: "Image ready",
    generate_image_to_video: "Image animation ready",
    generate_performance_creative: "Performance creative ready",
    generate_video: "Video ready",
  };
  const { data: currentJob, error: currentJobError } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", job.id)
    .maybeSingle();
  if (currentJobError) throw new Error(`Unable to verify job completion state: ${currentJobError.message}`);
  if (!currentJob || currentJob.status === "cancelled") return false;

  const { error } = await supabase.rpc("complete_job_with_credits", {
    p_actual_provider_cost_micros: undefined,
    p_job_id: job.id,
    p_result: result,
    p_stage: completionStage[job.kind],
  });
  if (error) throw new Error(`Unable to complete and settle job: ${error.message}`);
  return true;
}

async function markJobFailed(job: Job, target: WorkTarget, attempt: number, error: unknown) {
  const details = workerFailureDetails(error);
  const expectedExhausted = details.forceTerminal || attempt >= job.max_attempts;
  const { data, error: jobError } = await supabase.rpc("fail_job_with_credits", {
    p_attempt: attempt,
    p_error_code: details.code,
    p_error_message: details.message,
    p_force_terminal: details.forceTerminal,
    p_job_id: job.id,
    p_stage: details.stage ?? (expectedExhausted ? "Processing failed" : `Retry scheduled (${attempt}/${job.max_attempts})`),
  });
  if (jobError) workerLogger.error({ error: jobError.message, jobId: job.id }, "Unable to persist job failure");
  const exhausted = data && typeof data === "object" && !Array.isArray(data)
    ? data.exhausted === true
    : expectedExhausted;

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

async function markProviderBillingStarted(jobId: string) {
  const { data, error } = await supabase.rpc("mark_job_provider_started", { p_job_id: jobId });
  if (error || !data) {
    throw new Error(`Unable to mark provider billing start: ${error?.message ?? "credit reservation is not active"}`);
  }
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

    await requireCreditReservation(job.id);
    attempt = await markJobStarted(job);
    await markTargetStarted(job, target);
    tempDir = await mkdtemp(resolve(config.WORKER_TEMP_ROOT, `${job.id}-`));
    log.info({ attempt, kind: job.kind }, "Starting media job");
    const result = target.type === "project"
      ? await runPipeline({
          config,
          job: { ...job, attempt },
          markProviderBillingStarted: () => markProviderBillingStarted(job!.id),
          project: target.project,
          report: createReporter(job.id),
          supabase,
          tempDir,
        })
      : await runGenerationPipeline({
          config,
          generation: target.generation,
          job: { ...job, attempt },
          markProviderBillingStarted: () => markProviderBillingStarted(job!.id),
          report: createReporter(job.id),
          supabase,
          tempDir,
        });
    const completed = await markJobComplete(job, result);
    await archiveMessage(row.msg_id);
    log.info({ attempt, kind: job.kind }, completed ? "Media job completed" : "Cancelled media job stopped before settlement");
  } catch (error) {
    if (!job || !target) {
      log.error({ err: error }, "Queue message could not be matched to a job; archiving poison message");
      await archiveMessage(row.msg_id);
      return;
    }
    const { data: currentJob, error: currentJobError } = await supabase
      .from("jobs")
      .select("status")
      .eq("id", job.id)
      .maybeSingle();
    if (!currentJobError && currentJob?.status === "cancelled") {
      log.info({ attempt, kind: job.kind }, "Archiving job cancelled by the user");
      await archiveMessage(row.msg_id);
      return;
    }
    const failure = await markJobFailed(job, target, attempt || job.attempt + 1, error);
    log.error({ attempt, err: error, retrying: !failure.exhausted }, failure.details.message);
    if (failure.exhausted) {
      await archiveMessage(row.msg_id);
    } else {
      const retryDelaySeconds = Math.min(15 * (2 ** Math.max(0, attempt - 1)), 120);
      const { data: retryScheduled, error: retryError } = await supabase.rpc("retry_video_job", {
        message_id: row.msg_id,
        retry_delay_seconds: retryDelaySeconds,
      });
      if (retryError || !retryScheduled) {
        log.error({ error: retryError?.message, retryDelaySeconds }, "Unable to schedule queue retry");
      } else {
        log.info({ retryDelaySeconds }, "Queue retry scheduled");
      }
    }
  } finally {
    if (tempDir) {
      await rm(tempDir, { force: true, recursive: true }).catch((error) => {
        log.warn({ err: error, tempDir }, "Unable to clean job temporary directory");
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
      workerLogger.error({ err: error }, "Worker poll failed");
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
  workerLogger.fatal({ err: error }, "Video worker failed to start");
  process.exitCode = 1;
});
