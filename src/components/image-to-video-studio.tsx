"use client";

/* eslint-disable @next/next/no-img-element -- Source previews are local object URLs and results use private signed URLs. */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  AudioLines,
  Bot,
  Check,
  CircleAlert,
  Film,
  ImagePlus,
  Images,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DismissProcessButton } from "@/components/dismiss-process-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { VideoStylePicker } from "@/components/video-style-picker";
import type { CreditSummary } from "@/lib/credits";
import type { GenerationView } from "@/lib/data/generations";
import {
  imageToVideoAgentById,
  imageToVideoAgents,
  type ImageToVideoResolution,
  type VideoDuration,
} from "@/lib/domain/ai-models";
import type { GenerationRoutingProfile } from "@/lib/domain/generation";
import type { VideoVisualStyle } from "@/lib/domain/video-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.generated";

type Frame = { file: File; height: number; previewUrl: string; width: number };
type FrameRole = "end" | "start";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 8 * 1024 * 1024;
const motionExamples = [
  "Slow cinematic push-in. The subject turns naturally toward camera while soft wind moves fabric and background details. Preserve identity and lighting.",
  "A gentle orbit reveals the product materials. Reflections travel across the surface and subtle atmospheric particles create depth.",
  "The environment comes alive with believable motion as the camera rises into a wide reveal, ending on a stable hero frame.",
];
const motionStrengths = [
  { label: "Subtle", value: "subtle", detail: "Micro-motion and maximum identity stability" },
  { label: "Balanced", value: "balanced", detail: "Cinematic motion with reliable source fidelity" },
  { label: "Dynamic", value: "dynamic", detail: "Stronger action and environmental movement" },
] as const;
const profiles: Array<{ label: string; value: GenerationRoutingProfile; detail: string }> = [
  { label: "Quality", value: "quality", detail: "Highest-fidelity compatible route" },
  { label: "Balanced", value: "balanced", detail: "Quality, speed, and cost" },
  { label: "Speed", value: "speed", detail: "Fastest compatible model" },
  { label: "Economy", value: "cost", detail: "Lowest estimated provider cost" },
];

async function apiMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  return payload?.error?.message ?? "Image animation could not be started.";
}

function extensionFor(file: File) {
  return file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
}

async function inspectFrame(file: File): Promise<Omit<Frame, "previewUrl">> {
  if (!acceptedTypes.has(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > maxBytes) throw new Error("Each source image must be 8 MB or smaller.");
  const bitmap = await createImageBitmap(file);
  const dimensions = { file, height: bitmap.height, width: bitmap.width };
  bitmap.close();
  if (Math.min(dimensions.width, dimensions.height) < 512) {
    throw new Error("Use an image at least 512 pixels on its shortest side; 720p or larger gives the best motion fidelity.");
  }
  return dimensions;
}

function SourceFrame({ frame, label, onChoose, onClear, optional }: {
  frame: Frame | null;
  label: string;
  onChoose: (file: File | null) => void;
  onClear: () => void;
  optional?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between"><Label>{label}</Label>{optional ? <span className="text-[11px] text-muted-foreground">Optional transition target</span> : <span className="text-[11px] text-primary">Required</span>}</div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); onChoose(event.dataTransfer.files[0] ?? null); }}
        className="group relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/55 transition hover:border-primary/35"
      >
        {frame ? <img src={frame.previewUrl} alt={`${label} preview`} className="absolute inset-0 size-full object-contain" /> : <div className="p-5 text-center"><ImagePlus className="mx-auto size-5 text-primary" /><p className="mt-3 text-sm font-medium">Drop or choose an image</p><p className="mt-1 text-[11px] text-muted-foreground">JPG, PNG, WebP · 8 MB</p></div>}
        {frame ? <span className="absolute bottom-2 rounded-full border border-white/10 bg-black/65 px-2.5 py-1 text-[10px] text-white/80 backdrop-blur">{frame.width} × {frame.height}</span> : null}
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => onChoose(event.target.files?.[0] ?? null)} />
      {frame ? <button type="button" onClick={onClear} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"><X className="size-3" /> Remove frame</button> : null}
    </div>
  );
}

export function ImageToVideoStudio({ initialCredits, initialGenerations, isAuthenticated, userId }: {
  initialCredits: CreditSummary | null;
  initialGenerations: GenerationView[];
  isAuthenticated: boolean;
  userId: string | null;
}) {
  const router = useRouter();
  const previewUrls = useRef(new Set<string>());
  const [startFrame, setStartFrame] = useState<Frame | null>(null);
  const [endFrame, setEndFrame] = useState<Frame | null>(null);
  const [name, setName] = useState("Untitled image animation");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("blur, distortion, unstable subjects, duplicated objects, warped anatomy, flicker, low quality");
  const [agentId, setAgentId] = useState("auto");
  const [profile, setProfile] = useState<GenerationRoutingProfile>("balanced");
  const [duration, setDuration] = useState<VideoDuration>("6s");
  const [resolution, setResolution] = useState<ImageToVideoResolution>("1080p");
  const [aspectRatio, setAspectRatio] = useState("auto");
  const [cameraMotion, setCameraMotion] = useState("auto");
  const [motionStrength, setMotionStrength] = useState<"subtle" | "balanced" | "dynamic">("balanced");
  const [visualStyle, setVisualStyle] = useState<VideoVisualStyle>("cinematic");
  const [preserveSubject, setPreserveSubject] = useState(true);
  const [generateAudio, setGenerateAudio] = useState(true);
  const [seed, setSeed] = useState("");
  const [credits, setCredits] = useState(initialCredits);
  const [generations, setGenerations] = useState(initialGenerations);
  const [selectedId, setSelectedId] = useState<string | null>(initialGenerations[0]?.id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPaidSubscription = credits?.active === true;
  const selected = generations.find((generation) => generation.id === selectedId) ?? generations[0];
  const selectedAgent = imageToVideoAgentById(agentId) ?? imageToVideoAgents[0];
  const candidates = imageToVideoAgents.filter((agent) => agent.id !== "auto" && (!endFrame || agent.supportsEndFrame));
  const availableDurations = agentId === "auto"
    ? [...new Set(candidates.filter((agent) => agent.resolutions.includes(resolution) && agent.aspectRatios.includes(aspectRatio as never)).flatMap((agent) => agent.durations))]
    : selectedAgent.durations;
  const availableResolutions = agentId === "auto"
    ? [...new Set(candidates.filter((agent) => agent.durations.includes(duration) && agent.aspectRatios.includes(aspectRatio as never)).flatMap((agent) => agent.resolutions))]
    : selectedAgent.resolutions;
  const availableAspectRatios = agentId === "auto"
    ? [...new Set(candidates.filter((agent) => agent.durations.includes(duration) && agent.resolutions.includes(resolution)).flatMap((agent) => agent.aspectRatios))]
    : selectedAgent.aspectRatios;
  const activeIds = useMemo(
    () => generations.filter((generation) => ["processing", "queued", "retrying"].includes(generation.status)).map((generation) => generation.id).join(","),
    [generations],
  );

  useEffect(() => () => {
    for (const url of previewUrls.current) URL.revokeObjectURL(url);
    previewUrls.current.clear();
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
        } catch { return null; }
      }));
      if (cancelled) return;
      const byId = new Map(updates.filter((item): item is GenerationView => item !== null).map((item) => [item.id, item]));
      setGenerations((current) => current.map((item) => byId.get(item.id) ?? item));
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [activeIds]);

  async function chooseFrame(role: FrameRole, file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const inspected = await inspectFrame(file);
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      const next = { ...inspected, previewUrl };
      const current = role === "start" ? startFrame : endFrame;
      if (current) { URL.revokeObjectURL(current.previewUrl); previewUrls.current.delete(current.previewUrl); }
      if (role === "start") {
        setStartFrame(next);
        if (name === "Untitled image animation") setName(`${file.name.replace(/\.[^.]+$/, "")} motion`.slice(0, 120));
      } else {
        setEndFrame(next);
        if (agentId !== "auto" && !imageToVideoAgentById(agentId)?.supportsEndFrame) setAgentId("auto");
      }
    } catch (frameError) {
      setError(frameError instanceof Error ? frameError.message : "Unable to read the image.");
    }
  }

  function clearFrame(role: FrameRole) {
    const current = role === "start" ? startFrame : endFrame;
    if (current) { URL.revokeObjectURL(current.previewUrl); previewUrls.current.delete(current.previewUrl); }
    if (role === "start") setStartFrame(null); else setEndFrame(null);
  }

  function selectAgent(nextAgentId: string) {
    if (!hasPaidSubscription) return;
    setAgentId(nextAgentId);
    const agent = imageToVideoAgentById(nextAgentId);
    if (!agent || agent.id === "auto") return;
    if (!agent.durations.includes(duration)) setDuration(agent.durations[0]);
    if (!agent.resolutions.includes(resolution)) setResolution(agent.resolutions[0]);
    if (!agent.aspectRatios.includes(aspectRatio as never)) setAspectRatio(agent.aspectRatios[0]);
    if (!agent.supportsAudio) setGenerateAudio(false);
    if (endFrame && !agent.supportsEndFrame) clearFrame("end");
  }

  async function refreshCreditSummary() {
    const response = await fetch("/api/billing/credits", { cache: "no-store" });
    if (!response.ok) return;
    setCredits(((await response.json()) as { credits: CreditSummary }).credits);
  }

  async function dismissGeneration(generationId: string) {
    setGenerations((current) => current.filter((generation) => generation.id !== generationId));
    setSelectedId((current) => current === generationId ? null : current);
    await refreshCreditSummary();
  }

  async function submit() {
    if (!startFrame || !prompt.trim() || !name.trim()) return;
    if (!isAuthenticated || !userId) { router.push(`/login?next=${encodeURIComponent("/generate/image-to-video")}`); return; }
    if (!hasPaidSubscription) { setError("Image-to-video generation requires an active paid subscription. Choose a plan to unlock every motion model."); return; }
    setSubmitting(true);
    setError(null);
    const uploadId = crypto.randomUUID();
    const sourcePath = `${userId}/image-to-video/${uploadId}-start.${extensionFor(startFrame.file)}`;
    const endSourcePath = endFrame ? `${userId}/image-to-video/${uploadId}-end.${extensionFor(endFrame.file)}` : undefined;
    const uploadedPaths: string[] = [];
    const supabase = createClient();
    try {
      const { error: sourceError } = await supabase.storage.from("video-assets").upload(sourcePath, startFrame.file, { cacheControl: "3600", contentType: startFrame.file.type, upsert: false });
      if (sourceError) throw new Error(`Secure start-frame upload failed: ${sourceError.message}`);
      uploadedPaths.push(sourcePath);
      if (endFrame && endSourcePath) {
        const { error: endError } = await supabase.storage.from("video-assets").upload(endSourcePath, endFrame.file, { cacheControl: "3600", contentType: endFrame.file.type, upsert: false });
        if (endError) throw new Error(`Secure end-frame upload failed: ${endError.message}`);
        uploadedPaths.push(endSourcePath);
      }
      const numericSeed = seed.trim() ? Number(seed) : undefined;
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId, aspectRatio, cameraMotion, duration,
          ...(endFrame && endSourcePath ? { endSourceMime: endFrame.file.type, endSourcePath } : {}),
          generateAudio, kind: "image_to_video", motionStrength, name: name.trim(), negativePrompt: negativePrompt.trim(),
          preserveSubject, profile, prompt: prompt.trim(), resolution, seed: numericSeed,
          sourceBucket: "video-assets", sourceMime: startFrame.file.type, sourcePath, visualStyle,
        }),
      });
      if (!response.ok) {
        await supabase.storage.from("video-assets").remove(uploadedPaths);
        throw new Error(await apiMessage(response));
      }
      const result = (await response.json()) as { generation: Tables<"generations">; job: Tables<"jobs"> };
      const next: GenerationView = { ...result.generation, job: result.job, outputUrl: null };
      setGenerations((current) => [next, ...current]);
      setSelectedId(next.id);
      clearFrame("start"); clearFrame("end"); setPrompt(""); setName("Untitled image animation");
      await refreshCreditSummary();
    } catch (submissionError) {
      if (uploadedPaths.length) await supabase.storage.from("video-assets").remove(uploadedPaths);
      setError(submissionError instanceof Error ? submissionError.message : "Unable to start image animation.");
    } finally { setSubmitting(false); }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/70 px-5 py-7 sm:px-7">
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl"><Badge variant="outline" className="mb-4 border-primary/25 bg-primary/5 text-primary"><Images className="size-3.5" /> New multi-model studio</Badge><h1 className="text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Turn one still frame into a directed, believable shot.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Animate people, products, artwork, and scenes with source-identity lock, optional first-to-last-frame transitions, camera direction, native audio, and compatible premium models.</p></div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">{["Private source frames", "Up to native 4K", "Retry-safe delivery"].map((item) => <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-2"><Check className="size-3 text-primary" />{item}</span>)}</div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(320px,0.72fr)]">
        <Card className="border-border bg-card/70"><CardContent className="space-y-6 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2"><SourceFrame frame={startFrame} label="Start frame" onChoose={(file) => void chooseFrame("start", file)} onClear={() => clearFrame("start")} /><SourceFrame frame={endFrame} label="End frame" optional onChoose={(file) => void chooseFrame("end", file)} onClear={() => clearFrame("end")} /></div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]"><div className="space-y-2"><Label htmlFor="motion-name">Project name</Label><Input id="motion-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} /></div><div className="space-y-2"><Label htmlFor="motion-seed">Seed <span className="font-normal text-muted-foreground">optional</span></Label><Input id="motion-seed" value={seed} onChange={(event) => setSeed(event.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="Random" /></div></div>
          <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="motion-prompt">Describe only the motion</Label><span className="text-[11px] text-muted-foreground">{prompt.length}/4000</span></div><Textarea id="motion-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} minLength={3} maxLength={4000} required placeholder={motionExamples[0]} className="min-h-28 resize-y leading-6" /><div className="flex flex-wrap gap-2">{motionExamples.slice(1).map((example, index) => <button key={example} type="button" onClick={() => setPrompt(example)} className="rounded-full border border-border bg-muted/55 px-3 py-1.5 text-[11px] text-muted-foreground hover:border-primary/25 hover:text-foreground">Motion idea {index + 1}</button>)}</div></div>

          <div className="rounded-xl border border-primary/15 bg-primary/[0.045] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="inline-flex items-center gap-2 text-sm font-medium"><Bot className="size-4 text-primary" /> Motion model</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Only compatible duration, resolution, aspect, and end-frame options remain selectable.</p></div><Select value={agentId} onValueChange={selectAgent} disabled={!hasPaidSubscription}><SelectTrigger className="h-10 w-full bg-card sm:w-[265px]"><SelectValue /></SelectTrigger><SelectContent align="end" className="w-[340px]">{imageToVideoAgents.map((agent) => <SelectItem key={agent.id} value={agent.id}><span className="font-medium">{agent.label}</span><span className="ml-2 text-[10px] text-muted-foreground">{agent.tag}</span></SelectItem>)}</SelectContent></Select></div><div className="mt-3 grid gap-2 sm:grid-cols-3"><span className="rounded-lg bg-card/70 px-3 py-2 text-[11px] text-muted-foreground">{selectedAgent.description}</span><span className="rounded-lg bg-card/70 px-3 py-2 text-[11px] text-muted-foreground">{selectedAgent.durations.join(", ")} durations</span><span className="rounded-lg bg-card/70 px-3 py-2 text-[11px] text-muted-foreground">{selectedAgent.resolutions.join(", ")} output</span></div></div>

          <div><Label>Routing intent</Label><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{profiles.map((item) => <button key={item.value} type="button" aria-pressed={profile === item.value} disabled={!hasPaidSubscription} onClick={() => setProfile(item.value)} className={cn("rounded-xl border p-3 text-left transition disabled:opacity-60", profile === item.value ? "border-primary/35 bg-primary/[0.08]" : "border-border bg-muted/55 hover:border-primary/20")}><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p></button>)}</div></div>

          <div><div className="flex items-end justify-between gap-4"><div><Label>Visual style</Label><p className="mt-1 text-xs text-muted-foreground">Applied as motion art direction while preserving the source frame.</p></div><Badge variant="secondary" className="hidden sm:inline-flex">Source-aware</Badge></div><div className="mt-3"><VideoStylePicker value={visualStyle} onChange={setVisualStyle} /></div></div>
          <div><Label>Motion intensity</Label><div className="mt-3 grid gap-2 sm:grid-cols-3">{motionStrengths.map((item) => <button key={item.value} type="button" aria-pressed={motionStrength === item.value} onClick={() => setMotionStrength(item.value)} className={cn("rounded-xl border p-3 text-left", motionStrength === item.value ? "border-primary/35 bg-primary/[0.08]" : "border-border bg-muted/55")}><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{item.detail}</p></button>)}</div></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2"><Label>Camera</Label><Select value={cameraMotion} onValueChange={setCameraMotion}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Motion Autopilot</SelectItem><SelectItem value="static">Locked camera</SelectItem><SelectItem value="dolly-in">Dolly in</SelectItem><SelectItem value="orbit">Orbit</SelectItem><SelectItem value="handheld">Cinematic handheld</SelectItem><SelectItem value="drone">Aerial reveal</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Duration</Label><Select value={duration} onValueChange={(value) => setDuration(value as VideoDuration)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{availableDurations.map((value) => <SelectItem key={value} value={value}>{Number.parseInt(value, 10)} seconds</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Resolution</Label><Select value={resolution} onValueChange={(value) => setResolution(value as ImageToVideoResolution)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{availableResolutions.map((value) => <SelectItem key={value} value={value}>{value === "4k" ? "4K premium" : value === "1440p" ? "1440p / 2K" : value}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Frame</Label><Select value={aspectRatio} onValueChange={setAspectRatio}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{availableAspectRatios.map((value) => <SelectItem key={value} value={value}>{value === "auto" ? "Match source image" : value}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex h-[66px] items-end"><div className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-input/20 px-3"><span className="inline-flex items-center gap-2 text-sm"><LockKeyhole className="size-4 text-primary" /> Identity lock</span><Switch checked={preserveSubject} onCheckedChange={setPreserveSubject} aria-label="Preserve source subject identity" /></div></div>
            <div className="flex h-[66px] items-end"><div className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-input/20 px-3"><span className="inline-flex items-center gap-2 text-sm"><AudioLines className="size-4 text-primary" /> Native audio</span><Switch checked={generateAudio} onCheckedChange={setGenerateAudio} aria-label="Generate synchronized audio" /></div></div>
          </div>
          <details className="rounded-xl border border-border bg-muted/35 p-4"><summary className="cursor-pointer text-sm font-medium">Advanced negative prompt</summary><div className="mt-3 space-y-2"><Label htmlFor="negative-motion">Exclude from the result</Label><Textarea id="negative-motion" value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} maxLength={1500} className="min-h-20" /></div></details>
          {error ? <Alert variant="destructive"><CircleAlert className="size-4" /><AlertDescription>{error}</AlertDescription></Alert> : null}
          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-md text-xs leading-5 text-muted-foreground">Private frames are signed for the worker only, removed after successful processing, and provider keys never reach the browser.</p><Button type="button" size="lg" onClick={() => void submit()} disabled={!startFrame || !prompt.trim() || !name.trim() || submitting} className="h-11 px-6">{submitting ? <LoaderCircle className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}{submitting ? "Securing frames…" : !isAuthenticated ? "Sign in to animate" : !hasPaidSubscription ? "Choose a plan to animate" : "Animate image"}</Button></div>
        </CardContent></Card>

        <div className="space-y-4"><Card className="overflow-hidden border-border bg-card/70"><div className="relative grid min-h-[430px] place-items-center bg-black">{selected?.outputUrl ? <video src={selected.outputUrl} controls preload="metadata" className="max-h-[640px] w-full object-contain" /> : selected ? <div className="px-8 text-center"><LoaderCircle className={cn("mx-auto size-7 text-primary", ["processing", "queued", "retrying"].includes(selected.status) && "animate-spin")} /><p className="mt-4 text-sm font-medium">{selected.job?.stage ?? selected.status}</p><Progress value={selected.job?.progress ?? 0} className="mx-auto mt-4 w-44" />{selected.last_error ? <p className="mt-4 max-w-sm text-xs leading-5 text-red-300">{selected.last_error}</p> : null}</div> : <div className="px-8 text-center"><Film className="mx-auto size-8 text-primary" /><p className="mt-4 font-medium text-white">Your animated shot appears here</p><p className="mt-2 max-w-xs text-xs leading-5 text-white/55">Upload a start frame, describe its motion, and let Motion Autopilot select a compatible model.</p></div>}{selected && selected.status !== "completed" ? <DismissProcessButton endpoint={`/api/generations/${selected.id}`} label={`${["processing", "queued", "retrying"].includes(selected.status) ? "Cancel and remove" : "Remove"} ${selected.name}`} onDismiss={() => dismissGeneration(selected.id)} onError={setError} className="absolute right-3 top-3" /> : null}</div>{selected ? <CardContent className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{selected.name}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{selected.model_endpoint ?? "Motion Autopilot selecting a model"}</p></div>{selected.outputUrl ? <Button asChild variant="outline"><a href={selected.outputUrl} target="_blank" rel="noreferrer"><ArrowDownToLine className="size-4" /> Download MP4</a></Button> : null}</CardContent> : null}</Card>
          <div className="rounded-xl border border-primary/15 bg-primary/[0.045] p-4"><p className="inline-flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-primary" /> Accuracy guardrails</p><ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground"><li>• Model-specific duration, frame, and resolution compatibility</li><li>• Source-identity direction for faces, products, materials, and text</li><li>• Optional end-frame interpolation only on supported models</li><li>• Credit reservation before the provider request</li></ul></div>
        </div>
      </section>

      <section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-semibold">Recent image animations</h2><p className="mt-1 text-sm text-muted-foreground">Private outputs with visible model routing.</p></div><span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><RefreshCw className={cn("size-3", activeIds && "animate-spin")} />{activeIds ? "Live updates" : `${generations.length} total`}</span></div>{generations.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{generations.map((generation) => <div key={generation.id} className={cn("relative overflow-hidden rounded-xl border bg-card/65", selected?.id === generation.id ? "border-primary/35" : "border-border")}><button type="button" onClick={() => setSelectedId(generation.id)} className="block w-full text-left"><div className="grid aspect-video place-items-center bg-black">{generation.outputUrl ? <video src={generation.outputUrl} muted preload="metadata" className="size-full object-cover" /> : <LoaderCircle className={cn("size-5 text-primary", ["processing", "queued", "retrying"].includes(generation.status) && "animate-spin")} />}</div><div className="p-3"><p className="truncate text-sm font-medium">{generation.name}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{generation.status} · {generation.model_endpoint ?? "Autopilot"}</p></div></button>{generation.status !== "completed" ? <DismissProcessButton endpoint={`/api/generations/${generation.id}`} label={`${["processing", "queued", "retrying"].includes(generation.status) ? "Cancel and remove" : "Remove"} ${generation.name}`} onDismiss={() => dismissGeneration(generation.id)} onError={setError} className="absolute right-2.5 top-2.5" /> : null}</div>)}</div> : <Card className="border-dashed bg-card/35"><CardContent className="grid min-h-40 place-items-center p-8 text-center"><div><Images className="mx-auto size-5 text-primary" /><p className="mt-3 text-sm">No image animations yet.</p></div></CardContent></Card>}</section>
    </main>
  );
}
