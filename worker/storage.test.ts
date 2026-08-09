import { ReadStream } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { WorkerConfig } from "./config";

type CapturedUploadOptions = {
  endpoint?: string;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
  onSuccess?: () => void;
  uploadSize?: number;
};

const uploadCapture = vi.hoisted(() => ({
  options: undefined as CapturedUploadOptions | undefined,
  source: undefined as unknown,
}));

vi.mock("tus-js-client", () => ({
  Upload: class {
    private readonly options: CapturedUploadOptions;

    constructor(source: unknown, options: CapturedUploadOptions) {
      uploadCapture.source = source;
      uploadCapture.options = options;
      this.options = options;
    }

    start() {
      const size = this.options.uploadSize ?? 0;
      this.options.onProgress?.(size, size);
      this.options.onSuccess?.();
    }
  },
}));

import { uploadLargeObjectResumably } from "./storage";

describe("resumable worker uploads", () => {
  it("passes a Node ReadStream to the Node tus adapter", async () => {
    const progress: number[] = [];
    const config = {
      WORKER_SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key-value",
      WORKER_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
    } as WorkerConfig;

    await uploadLargeObjectResumably({
      bucket: "video-outputs",
      config,
      contentType: "video/mp4",
      filePath: resolve("package.json"),
      objectPath: "user/generation/output.mp4",
      onProgress: (fraction) => progress.push(fraction),
    });

    expect(uploadCapture.source).toBeInstanceOf(ReadStream);
    expect(uploadCapture.options?.endpoint).toBe(
      "https://abcdefghijklmnopqrst.storage.supabase.co/storage/v1/upload/resumable",
    );
    expect(progress).toEqual([1]);

    if (uploadCapture.source instanceof ReadStream) uploadCapture.source.destroy();
  });
});
