import { createFalClient } from "@fal-ai/client";

export function createWorkerFalClient(key: string | undefined) {
  if (!key) throw new Error("fal.ai requires the worker-only FAL_KEY environment variable.");
  return createFalClient({ credentials: key });
}
