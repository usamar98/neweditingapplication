"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, FileVideo, Loader2, Pause, Play, Upload, X } from "lucide-react";
import { Upload as TusUpload } from "tus-js-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  MAX_UPLOAD_BYTES,
  supportedVideoMimeTypes,
  TUS_CHUNK_SIZE,
  VIDEO_SOURCE_BUCKET,
} from "@/lib/domain/video";
import { formatBytes } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UploadAuthorization = {
  project: { id: string };
  upload: { endpoint: string; path: string; token: string };
};

const RESUME_RECORD_VERSION = 1;

function resumeStorageKey(file: File) {
  return `sceneforge:upload:v1:${encodeURIComponent(file.name)}:${file.size}:${file.lastModified}`;
}

function readResumeProjectId(file: File) {
  try {
    const raw = localStorage.getItem(resumeStorageKey(file));
    if (!raw) return undefined;
    const value = JSON.parse(raw) as { projectId?: unknown; version?: unknown };
    return value.version === RESUME_RECORD_VERSION && typeof value.projectId === "string"
      ? value.projectId
      : undefined;
  } catch {
    return undefined;
  }
}

function saveResumeProjectId(file: File, projectId: string) {
  try {
    localStorage.setItem(resumeStorageKey(file), JSON.stringify({
      projectId,
      version: RESUME_RECORD_VERSION,
    }));
  } catch {
    // Upload still works when a browser disables persistent storage.
  }
}

function clearResumeProjectId(file: File) {
  try {
    localStorage.removeItem(resumeStorageKey(file));
  } catch {
    // Nothing to clear when persistent storage is unavailable.
  }
}

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  return body?.error?.message ?? "The request failed. Please try again.";
}

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<TusUpload | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "authorizing" | "uploading" | "paused" | "processing">("idle");
  const [error, setError] = useState<string | null>(null);
  const busy = !["idle", "paused"].includes(phase);

  function chooseFile(nextFile: File | undefined) {
    setError(null);
    if (!nextFile) return;
    if (!supportedVideoMimeTypes.includes(nextFile.type as (typeof supportedVideoMimeTypes)[number])) {
      setError("Choose an MP4, MOV, WebM, or MKV video.");
      return;
    }
    if (nextFile.size > MAX_UPLOAD_BYTES) {
      setError("This video is larger than the 2 GB upload limit.");
      return;
    }
    setFile(nextFile);
    setName(nextFile.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 120));
    setProgress(0);
    setPhase("idle");
  }

  async function startUpload() {
    if (!file || !name.trim()) return;
    setError(null);
    setPhase("authorizing");

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Your session expired. Sign in again.");

      const resumeProjectId = readResumeProjectId(file);
      let authorizationResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, name: name.trim(), resumeProjectId, size: file.size }),
      });
      if (authorizationResponse.status === 404 && resumeProjectId) {
        clearResumeProjectId(file);
        authorizationResponse = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, mimeType: file.type, name: name.trim(), size: file.size }),
        });
      }
      if (!authorizationResponse.ok) throw new Error(await readApiError(authorizationResponse));
      const authorization = (await authorizationResponse.json()) as UploadAuthorization;
      saveResumeProjectId(file, authorization.project.id);

      const upload = new TusUpload(file, {
        chunkSize: TUS_CHUNK_SIZE,
        endpoint: authorization.upload.endpoint,
        fingerprint: async (uploadFile) => [
          "sceneforge",
          authorization.project.id,
          uploadFile.name,
          uploadFile.type,
          uploadFile.size,
          uploadFile.lastModified,
        ].join("-"),
        headers: {
          authorization: `Bearer ${sessionData.session.access_token}`,
          "x-signature": authorization.upload.token,
        },
        metadata: {
          bucketName: VIDEO_SOURCE_BUCKET,
          cacheControl: "3600",
          contentType: file.type,
          metadata: JSON.stringify({ originalName: file.name, projectId: authorization.project.id }),
          objectName: authorization.upload.path,
        },
        onError(uploadError) {
          setError(uploadError.message || "The upload was interrupted.");
          setPhase("paused");
        },
        onProgress(bytesUploaded, bytesTotal) {
          setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
          setPhase("uploading");
        },
        onSuccess() {
          void (async () => {
            clearResumeProjectId(file);
            setPhase("processing");
            const jobResponse = await fetch(`/api/projects/${authorization.project.id}/jobs`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kind: "analyze" }),
            });
            if (!jobResponse.ok) {
              setError(await readApiError(jobResponse));
              setPhase("idle");
              return;
            }
            router.push(`/projects/${authorization.project.id}`);
            router.refresh();
          })();
        },
        removeFingerprintOnSuccess: true,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        uploadDataDuringCreation: true,
      });

      uploadRef.current = upload;
      const previous = await upload.findPreviousUploads();
      if (previous.length > 0) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to start the upload.");
      setPhase("idle");
    }
  }

  async function pauseUpload() {
    await uploadRef.current?.abort(false);
    setPhase("paused");
  }

  function clearFile() {
    void uploadRef.current?.abort(false);
    uploadRef.current = null;
    setFile(null);
    setProgress(0);
    setPhase("idle");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div id="new-project" className="scroll-mt-24">
      <Input
        ref={inputRef}
        type="file"
        accept={supportedVideoMimeTypes.join(",")}
        className="hidden"
        onChange={(event) => chooseFile(event.target.files?.[0])}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0]); }}
          className={cn(
            "group flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/55 px-6 text-center transition",
            "hover:border-primary/35 hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <span className="mb-4 grid size-12 place-items-center rounded-2xl border border-border bg-card text-muted-foreground shadow-sm transition group-hover:border-primary/20 group-hover:text-primary">
            <Upload className="size-5" />
          </span>
          <span className="font-medium">Drop a video here, or browse</span>
          <span className="mt-2 text-sm text-muted-foreground">MP4, MOV, WebM, or MKV · up to 2 GB</span>
          <span className="mt-4 rounded-full bg-white/[0.035] px-3 py-1 text-[11px] text-muted-foreground">Uploads resume automatically</span>
        </button>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/55 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileVideo className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatBytes(file.size)} · {file.type}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={clearFile} disabled={busy} aria-label="Remove file"><X className="size-4" /></Button>
          </div>
          <div className="mt-5 space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input id="project-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} disabled={busy} />
          </div>
          {progress > 0 && (
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">{phase === "processing" ? "Preparing AI analysis" : phase === "paused" ? "Upload paused" : "Uploading securely"}</span><span className="font-mono">{progress}%</span></div>
              <Progress value={progress} />
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {phase === "paused" ? (
              <Button onClick={() => uploadRef.current?.start()}><Play className="size-4" /> Resume</Button>
            ) : phase === "uploading" ? (
              <Button variant="outline" onClick={pauseUpload}><Pause className="size-4" /> Pause</Button>
            ) : (
              <Button onClick={startUpload} disabled={busy || !name.trim()}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {phase === "authorizing" ? "Securing upload" : phase === "processing" ? "Starting analysis" : "Upload & analyze"}
              </Button>
            )}
            <Button variant="ghost" onClick={() => inputRef.current?.click()} disabled={busy}>Choose another</Button>
          </div>
        </div>
      )}
      {error && <Alert variant="destructive" className="mt-4"><CircleAlert className="size-4" /><AlertDescription>{error}</AlertDescription></Alert>}
    </div>
  );
}
