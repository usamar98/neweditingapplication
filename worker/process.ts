import { spawn } from "node:child_process";

const MAX_CAPTURE_LENGTH = 2 * 1024 * 1024;

export class ProcessError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly exitCode: number | null,
    public readonly stderr: string,
  ) {
    super(message);
    this.name = "ProcessError";
  }
}

export async function runProcess({
  args,
  command,
  onStderr,
  timeoutMs = 2 * 60 * 60 * 1000,
}: {
  args: string[];
  command: string;
  onStderr?: (chunk: string) => void;
  timeoutMs?: number;
}) {
  return new Promise<{ stderr: string; stdout: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      child.kill("SIGKILL");
      settled = true;
      reject(new ProcessError(`Process timed out after ${timeoutMs}ms`, command, null, stderr));
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout = (stdout + chunk).slice(-MAX_CAPTURE_LENGTH);
    });
    child.stderr.on("data", (chunk: string) => {
      stderr = (stderr + chunk).slice(-MAX_CAPTURE_LENGTH);
      onStderr?.(chunk);
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new ProcessError(error.message, command, null, stderr));
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code === 0) resolve({ stderr, stdout });
      else reject(new ProcessError(`${command} exited with code ${code}`, command, code, stderr));
    });
  });
}
