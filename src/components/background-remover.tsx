"use client";

/* eslint-disable @next/next/no-img-element -- Previews include local object URLs and short-lived private URLs. */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, Bot, Check, CircleAlert, ImagePlus, LoaderCircle, RefreshCw, Scissors, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DismissProcessButton } from "@/components/dismiss-process-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreditSummary } from "@/lib/credits";
import type { GenerationView } from "@/lib/data/generations";
import { backgroundAgents } from "@/lib/domain/ai-models";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.generated";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 20 * 1024 * 1024;

async function apiMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  return payload?.error?.message ?? "Background removal could not be started.";
}

export function BackgroundRemover({
  initialCredits,
  initialGenerations,
  isAuthenticated,
  userId,
}: {
  initialCredits: CreditSummary | null;
  initialGenerations: GenerationView[];
  isAuthenticated: boolean;
  userId: string | null;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [agentId, setAgentId] = useState("auto");
  const [credits, setCredits] = useState(initialCredits);
  const hasPaidSubscription = credits?.active === true;
  const [name, setName] = useState("Background-free image");
  const [generations, setGenerations] = useState(initialGenerations);
  const [selectedId, setSelectedId] = useState<string | null>(initialGenerations[0]?.id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = generations.find((generation) => generation.id === selectedId) ?? generations[0];
  const activeIds = useMemo(
    () => generations
      .filter((generation) => ["processing", "queued", "retrying"].includes(generation.status))
      .map((generation) => generation.id)
      .join(","),
    [generations],
  );

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  useEffect(() => {
    if (!activeIds) return;
    const ids = activeIds.split(",");
    let cancelled = false;
    async function refresh() {
      const updates = await Promise.all(ids.map(async (id) => {
        try {
          const response = await fetch(`/api/generations/${id}`, { cache: "no-store" });
          if (!response.ok) return null;
          return ((await response.json()) as { generation: GenerationView }).generation;
        } catch {
          return null;
        }
      }));
      if (cancelled) return;
      const byId = new Map(updates.filter((item): item is GenerationView => item !== null).map((item) => [item.id, item]));
      setGenerations((current) => current.map((item) => byId.get(item.id) ?? item));
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeIds]);

  function chooseFile(nextFile: File | null) {
    setError(null);
    if (!nextFile) {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
      setPreviewUrl(null);
      setFile(null);
      return;
    }
    if (!acceptedTypes.has(nextFile.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (nextFile.size > maxBytes) {
      setError("The source image must be 20 MB or smaller.");
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(nextFile);
    setPreviewUrl(previewRef.current);
    setFile(nextFile);
    if (name === "Background-free image") {
      setName(`${nextFile.name.replace(/\.[^.]+$/, "")} cutout`.slice(0, 120));
    }
  }

  async function refreshCreditSummary() {
    const response = await fetch("/api/billing/credits", { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { credits: CreditSummary };
    setCredits(body.credits);
  }

  async function dismissGeneration(generationId: string) {
    setGenerations((current) => current.filter((generation) => generation.id !== generationId));
    setSelectedId((current) => current === generationId ? null : current);
    await refreshCreditSummary();
  }

  async function submit() {
    if (!file || !name.trim()) return;
    if (!isAuthenticated || !userId) {
      router.push(`/login?next=${encodeURIComponent("/remove-background")}`);
      return;
    }
    if (!hasPaidSubscription) {
      setError("Background removal requires an active paid subscription. Choose a plan to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
    const sourcePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const supabase = createClient();

    try {
      const { error: uploadError } = await supabase.storage
        .from("background-inputs")
        .upload(sourcePath, file, { cacheControl: "3600", contentType: file.type, upsert: false });
      if (uploadError) throw new Error(`Secure upload failed: ${uploadError.message}`);

      const response = await fetch("/api/generations", {
        body: JSON.stringify({
          agentId,
          kind: "background_removal",
          name: name.trim(),
          profile: "quality",
          prompt: "Remove the image background with a clean transparent edge.",
          sourceBucket: "background-inputs",
          sourceMime: file.type,
          sourcePath,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        await supabase.storage.from("background-inputs").remove([sourcePath]);
        throw new Error(await apiMessage(response));
      }
      const result = (await response.json()) as { generation: Tables<"generations">; job: Tables<"jobs"> };
      const next: GenerationView = { ...result.generation, job: result.job, outputUrl: null };
      setGenerations((current) => [next, ...current]);
      setSelectedId(next.id);
      chooseFile(null);
      if (fileInput.current) fileInput.current.value = "";
      await refreshCreditSummary();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to start background removal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/70 px-5 py-7 sm:px-7">
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4 border-primary/25 bg-primary/5 text-primary"><Scissors className="size-3.5" /> New creative tool</Badge>
            <h1 className="text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Remove the background. Keep every important edge.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Private source uploads, precision matting for hair and products, a transparent PNG result, and a faster agent when speed matters.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {["20 MB source", "Private processing", "Transparent PNG"].map((item) => <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-2"><Check className="size-3 text-primary" />{item}</span>)}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="border-border bg-card/70">
          <CardContent className="space-y-5 p-5 sm:p-7">
            <div className="space-y-2">
              <Label htmlFor="cutout-name">Result name</Label>
              <Input id="cutout-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
            </div>

            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0] ?? null); }}
              className="group relative grid min-h-80 w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/55 text-center transition hover:border-primary/35"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Selected source" className="absolute inset-0 h-full w-full object-contain" />
              ) : (
                <div className="p-8"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><ImagePlus className="size-5" /></span><p className="mt-4 font-medium">Drop an image or choose a file</p><p className="mt-2 text-xs text-muted-foreground">JPG, PNG, or WebP up to 20 MB</p></div>
              )}
              {previewUrl && <span className="absolute bottom-3 rounded-full border border-white/10 bg-black/65 px-3 py-1.5 text-xs backdrop-blur">Choose another image</span>}
            </button>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />

            {error && <Alert variant="destructive"><CircleAlert className="size-4" /><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/55 p-2 sm:flex-row sm:items-center sm:justify-between">
              <Select value={agentId} onValueChange={setAgentId} disabled={!hasPaidSubscription}>
                <SelectTrigger aria-label="Select background removal agent" className="h-10 w-full bg-card sm:w-[250px]"><Bot className="size-4 text-primary" /><SelectValue /></SelectTrigger>
                <SelectContent align="start" className="w-[320px]">
                  {backgroundAgents.map((agent) => <SelectItem key={agent.id} value={agent.id}><span className="font-medium">{agent.label}</span><span className="ml-2 text-[10px] text-muted-foreground">{agent.tag}</span></SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => void submit()} disabled={!file || !name.trim() || submitting} size="lg" className="h-10">
                {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {submitting ? "Uploading…" : !isAuthenticated ? "Sign in to remove background" : !hasPaidSubscription ? "Choose a plan to continue" : "Remove background"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card/70">
          <div className="relative grid min-h-[420px] place-items-center bg-[linear-gradient(45deg,oklch(0.22_0.01_265)_25%,transparent_25%),linear-gradient(-45deg,oklch(0.22_0.01_265)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,oklch(0.22_0.01_265)_75%),linear-gradient(-45deg,transparent_75%,oklch(0.22_0.01_265)_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px]">
            {selected?.outputUrl ? (
              <img src={selected.outputUrl} alt={selected.name} className="max-h-[560px] w-full object-contain" />
            ) : selected ? (
              <div className="px-8 text-center"><LoaderCircle className="mx-auto size-7 animate-spin text-primary" /><p className="mt-4 text-sm font-medium">{selected.job?.stage ?? "Preparing cutout"}</p><Progress value={selected.job?.progress ?? 0} className="mx-auto mt-4 w-44" />{selected.last_error && <p className="mt-4 max-w-sm text-xs text-red-300">{selected.last_error}</p>}</div>
            ) : (
              <div className="px-8 text-center"><Scissors className="mx-auto size-8 text-primary" /><p className="mt-4 font-medium">Your transparent result appears here</p><p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">The checkerboard makes transparency easy to inspect before downloading.</p></div>
            )}
            {selected && selected.status !== "completed" && (
              <DismissProcessButton
                endpoint={`/api/generations/${selected.id}`}
                label={`${["processing", "queued", "retrying"].includes(selected.status) ? "Cancel and remove" : "Remove"} ${selected.name}`}
                onDismiss={() => dismissGeneration(selected.id)}
                onError={setError}
                className="absolute right-3 top-3"
              />
            )}
          </div>
          {selected && <CardContent className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{selected.name}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{selected.model_endpoint ?? "Cutout agent selecting a model"}</p></div>{selected.outputUrl && <Button asChild variant="outline"><a href={selected.outputUrl} download><ArrowDownToLine className="size-4" /> Download PNG</a></Button>}</CardContent>}
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-semibold">Recent cutouts</h2><p className="mt-1 text-sm text-muted-foreground">Private source processing and transparent results.</p></div><span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><RefreshCw className={cn("size-3", activeIds && "animate-spin")} />{activeIds ? "Live updates" : `${generations.length} total`}</span></div>
        {generations.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {generations.map((generation) => (
              <div key={generation.id} className={cn("relative overflow-hidden rounded-xl border bg-card/65", selected?.id === generation.id ? "border-primary/35" : "border-border")}>
                <button type="button" onClick={() => setSelectedId(generation.id)} className="block w-full text-left">
                  <div className="grid aspect-[4/3] place-items-center bg-muted/60">{generation.outputUrl ? <img src={generation.outputUrl} alt={generation.name} className="h-full w-full object-contain" /> : <LoaderCircle className="size-5 animate-spin text-primary" />}</div>
                  <div className="p-3"><p className="truncate text-sm font-medium">{generation.name}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{generation.status}</p></div>
                </button>
                {generation.status !== "completed" && (
                  <DismissProcessButton
                    endpoint={`/api/generations/${generation.id}`}
                    label={`${["processing", "queued", "retrying"].includes(generation.status) ? "Cancel and remove" : "Remove"} ${generation.name}`}
                    onDismiss={() => dismissGeneration(generation.id)}
                    onError={setError}
                    className="absolute right-2.5 top-2.5"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
