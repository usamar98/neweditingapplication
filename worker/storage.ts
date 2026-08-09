import { createReadStream, createWriteStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Upload } from "tus-js-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TUS_CHUNK_SIZE } from "../src/lib/domain/video";
import type { Database } from "../src/types/database.generated";
import type { WorkerConfig } from "./config";

export async function downloadStorageObject({
  bucket,
  destination,
  objectPath,
  supabase,
}: {
  bucket: string;
  destination: string;
  objectPath: string;
  supabase: SupabaseClient<Database>;
}) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 1800);
  if (error || !data) throw new Error(`Unable to sign ${bucket}/${objectPath}: ${error?.message ?? "unknown error"}`);
  const response = await fetch(data.signedUrl, { signal: AbortSignal.timeout(30 * 60 * 1000) });
  if (!response.ok || !response.body) throw new Error(`Storage download returned ${response.status}.`);
  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(destination, { flags: "wx" }));
}

export async function uploadSmallObject({
  bucket,
  contentType,
  filePath,
  objectPath,
  supabase,
}: {
  bucket: string;
  contentType: string;
  filePath: string;
  objectPath: string;
  supabase: SupabaseClient<Database>;
}) {
  const body = await readFile(filePath);
  const { error } = await supabase.storage.from(bucket).upload(objectPath, body, {
    cacheControl: "3600",
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Storage upload failed for ${objectPath}: ${error.message}`);
}

export async function uploadLargeObjectResumably({
  bucket,
  config,
  contentType,
  filePath,
  objectPath,
  onProgress,
}: {
  bucket: string;
  config: WorkerConfig;
  contentType: string;
  filePath: string;
  objectPath: string;
  onProgress?: (fraction: number) => void;
}) {
  const fileStat = await stat(filePath);
  const projectRef = new URL(config.WORKER_SUPABASE_URL).hostname.split(".")[0];
  const endpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
  const nodeStream = createReadStream(filePath);

  await new Promise<void>((resolve, reject) => {
    // tus-js-client selects its Node adapter in the worker. That adapter accepts
    // Buffer or Node Readable sources; a WebStream reader fails after the paid
    // provider call with "source object may only be an instance of Buffer or
    // Readable in this environment".
    const upload = new Upload(nodeStream, {
      chunkSize: TUS_CHUNK_SIZE,
      endpoint,
      headers: {
        apikey: config.WORKER_SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${config.WORKER_SUPABASE_SERVICE_ROLE_KEY}`,
      },
      metadata: {
        bucketName: bucket,
        cacheControl: "3600",
        contentType,
        objectName: objectPath,
      },
      onError: reject,
      onProgress(bytesUploaded, bytesTotal) {
        onProgress?.(bytesUploaded / bytesTotal);
      },
      onSuccess() {
        resolve();
      },
      removeFingerprintOnSuccess: true,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      uploadSize: fileStat.size,
    });
    upload.start();
  });
}
