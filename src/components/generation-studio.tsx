"use client";

/* eslint-disable @next/next/no-img-element -- Generated media uses short-lived private signed URLs. */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Aperture,
  ArrowDownToLine,
  AudioLines,
  Bot,
  Check,
  CircleAlert,
  Clock3,
  Film,
  Gauge,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  WandSparkles,
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
  agentsForKind,
  videoAgentById,
  videoAgents,
  type VideoDuration,
  type VideoResolution,
} from "@/lib/domain/ai-models";
import type { GenerationRoutingProfile } from "@/lib/domain/generation";
import type { VideoVisualStyle } from "@/lib/domain/video-styles";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.generated";
import aiImageVisual from "@/assets/media/ai-image.webp";
import aiVideoVisual from "@/assets/media/ai-video.webp";

const profiles: Array<{
  detail: string;
  icon: typeof Sparkles;
  label: string;
  value: GenerationRoutingProfile;
}> = [
  { detail: "Best available model", icon: Sparkles, label: "Quality", value: "quality" },
  { detail: "Smart default", icon: Bot, label: "Balanced", value: "balanced" },
  { detail: "Shortest wait", icon: Gauge, label: "Speed", value: "speed" },
  { detail: "Lowest estimated cost", icon: Clock3, label: "Economy", value: "cost" },
];

const statusLabels: Record<Tables<"generations">["status"], string> = {
  cancelled: "Cancelled",
  completed: "Ready",
  failed: "Needs attention",
  processing: "Creating",
  queued: "Queued",
  retrying: "Retrying",
};

const imageExamples = [
  "A luxury fragrance bottle on black volcanic glass, emerald rim light, cinematic product campaign",
  "A quiet brutalist library at blue hour, a lone reader, editorial architectural photography",
  "An expressive paper-cut illustration of a city powered by gardens, tactile layers and warm light",
];

const videoExamples = [
  "A pearl-white concept car glides through a rain-soaked neon city, ending on a dramatic hero frame",
  "Macro coffee beans tumble in slow motion before transforming into a perfect espresso in a sunlit studio",
  "A fashion model crosses a windswept salt flat at sunset as the camera orbits into a wide reveal",
];

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  return body?.error?.message ?? "Generation could not be started. Please try again.";
}

function GenerationStatus({ generation }: { generation: GenerationView }) {
  const active = ["processing", "queued", "retrying"].includes(generation.status);
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-white/10 bg-black/25 font-normal backdrop-blur",
        generation.status === "completed" && "border-primary/25 bg-primary/10 text-primary",
        generation.status === "failed" && "border-destructive/30 bg-destructive/10 text-red-300",
      )}
    >
      {active ? <LoaderCircle className="size-3 animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}
      {statusLabels[generation.status]}
    </Badge>
  );
}

function ModelAutopilot({ generation }: { generation?: GenerationView }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/[0.055] p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
          <Bot className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Model Autopilot</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {generation?.routing_reason
              ?? "Editing App compares the best compatible models for your quality, speed, and cost intent."}
          </p>
          {generation?.model_endpoint && (
            <p className="mt-2 truncate font-mono text-[10px] text-primary">{generation.model_endpoint}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaPreview({ controls = true, generation, kind }: { controls?: boolean; generation: GenerationView; kind: "image" | "video" }) {
  if (generation.outputUrl) {
    return kind === "image" ? (
      <img
        src={generation.outputUrl}
        alt={generation.name}
        className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-[1.015]"
      />
    ) : (
      <video src={generation.outputUrl} controls={controls} muted={!controls} preload="metadata" className="aspect-video h-full w-full object-cover" />
    );
  }

  return (
    <div className={cn("grid aspect-[4/3] place-items-center bg-[radial-gradient(circle_at_50%_35%,oklch(0.3_0.06_163),oklch(0.145_0.014_265)_68%)]", kind === "video" && "aspect-video")}>
      <div className="text-center">
        {generation.status === "failed" ? (
          <CircleAlert className="mx-auto size-6 text-red-300" />
        ) : (
          <WandSparkles className="mx-auto size-6 animate-pulse text-primary" />
        )}
        <p className="mt-3 text-xs text-white/60">{generation.job?.stage ?? statusLabels[generation.status]}</p>
        {generation.job && <Progress value={generation.job.progress} className="mx-auto mt-3 w-28" />}
      </div>
    </div>
  );
}

export function GenerationStudio({
  initialCredits,
  initialGenerations,
  isAuthenticated,
  kind,
}: {
  initialCredits: CreditSummary | null;
  initialGenerations: GenerationView[];
  isAuthenticated: boolean;
  kind: "image" | "video";
}) {
  const router = useRouter();
  const isImage = kind === "image";
  const agents = agentsForKind(kind);
  const [credits, setCredits] = useState(initialCredits);
  const hasPaidSubscription = credits?.active === true;
  const [agentId, setAgentId] = useState("auto");
  const [generations, setGenerations] = useState(initialGenerations);
  const [name, setName] = useState(isImage ? "Untitled image" : "Untitled video");
  const [prompt, setPrompt] = useState("");
  const [profile, setProfile] = useState<GenerationRoutingProfile>("balanced");
  const [aspectRatio, setAspectRatio] = useState(isImage ? "landscape_16_9" : "16:9");
  const [style, setStyle] = useState("cinematic");
  const [cameraMotion, setCameraMotion] = useState("auto");
  const [mood, setMood] = useState("cinematic");
  const [duration, setDuration] = useState<VideoDuration>("8s");
  const [resolution, setResolution] = useState<VideoResolution>("1080p");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [visualStyle, setVisualStyle] = useState<VideoVisualStyle>("cinematic");
  const [seed, setSeed] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialGenerations[0]?.id ?? null);

  const activeIds = useMemo(
    () => generations.filter((item) => ["processing", "queued", "retrying"].includes(item.status)).map((item) => item.id).join(","),
    [generations],
  );
  const selected = generations.find((item) => item.id === selectedId) ?? generations[0];
  const selectedVideoAgent = kind === "video" ? videoAgentById(agentId) : undefined;
  const availableDurations = kind === "video"
    ? selectedVideoAgent?.id === "auto"
      ? [...new Set(videoAgents.filter((agent) => agent.id !== "auto" && agent.resolutions.includes(resolution)).flatMap((agent) => agent.durations))]
      : selectedVideoAgent?.durations ?? []
    : [];
  const availableResolutions = kind === "video"
    ? selectedVideoAgent?.id === "auto"
      ? [...new Set(videoAgents.filter((agent) => agent.id !== "auto" && agent.durations.includes(duration)).flatMap((agent) => agent.resolutions))]
      : selectedVideoAgent?.resolutions ?? []
    : [];

  function selectAgent(nextAgentId: string) {
    if (!hasPaidSubscription) return;
    setAgentId(nextAgentId);
    if (kind !== "video") return;
    const agent = videoAgentById(nextAgentId);
    if (!agent || agent.id === "auto") return;
    if (!agent.durations.includes(duration)) setDuration(agent.durations[0]);
    if (!agent.resolutions.includes(resolution)) setResolution(agent.resolutions[0]);
    if (!agent.supportsAudio) setGenerateAudio(false);
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

  useEffect(() => {
    if (!activeIds) return;
    const ids = activeIds.split(",");
    let cancelled = false;

    async function refreshActive() {
      const refreshed = await Promise.all(ids.map(async (id) => {
        try {
          const response = await fetch(`/api/generations/${id}`, { cache: "no-store" });
          if (!response.ok) return null;
          const body = (await response.json()) as { generation: GenerationView };
          return body.generation;
        } catch {
          return null;
        }
      }));
      if (cancelled) return;
      const refreshedById = new Map(refreshed.filter((item): item is GenerationView => item !== null).map((item) => [item.id, item]));
      setGenerations((current) => current.map((item) => refreshedById.get(item.id) ?? item));
    }

    const timer = window.setInterval(() => void refreshActive(), 3000);
    void refreshActive();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeIds]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/generate/${kind}`)}`);
      return;
    }
    if (!hasPaidSubscription) {
      setError(`AI ${kind} generation requires an active paid subscription. Choose a plan to unlock every model.`);
      return;
    }

    setSubmitting(true);

    const numericSeed = seed.trim() ? Number(seed) : undefined;
    const payload = isImage
      ? { agentId, aspectRatio, kind: "image", name: name.trim(), profile, prompt: prompt.trim(), seed: numericSeed, style }
      : { agentId, aspectRatio, cameraMotion, duration, generateAudio, kind: "video", mood, name: name.trim(), profile, prompt: prompt.trim(), resolution, seed: numericSeed, visualStyle };

    try {
      const response = await fetch("/api/generations", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const result = (await response.json()) as { generation: Tables<"generations">; job: Tables<"jobs"> };
      const next: GenerationView = { ...result.generation, job: result.job, outputUrl: null };
      setGenerations((current) => [next, ...current]);
      setSelectedId(next.id);
      setPrompt("");
      setName(isImage ? "Untitled image" : "Untitled video");
      await refreshCreditSummary();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to start generation.");
    } finally {
      setSubmitting(false);
    }
  }

  const examples = isImage ? imageExamples : videoExamples;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/70 px-5 py-7 sm:px-7">
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4 border-primary/25 bg-primary/5 text-primary">
              {isImage ? <ImageIcon className="size-3.5" /> : <Film className="size-3.5" />} AI {kind} studio
            </Badge>
            <h1 className="text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              {isImage ? "Art direction, not prompt roulette." : "Direct a shot. Autopilot the model."}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              {isImage
                ? "Turn a creative brief into campaign-ready visuals with composition, style, and quality controls built in."
                : "Create coherent cinematic clips with camera direction, mood, resolution, and synchronized audio controls."}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-[360px]">
            {["Best-fit model", "Private output", "Visible routing"].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-muted/55 px-3 py-3 text-muted-foreground">
                <Check className="mx-auto mb-2 size-3.5 text-primary" />{item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <Card className="border-border bg-card/70">
          <CardContent className="p-5 sm:p-7">
            <form onSubmit={submit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
                <div className="space-y-2">
                  <Label htmlFor={`${kind}-name`}>Project name</Label>
                  <Input id={`${kind}-name`} value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${kind}-seed`}>Seed <span className="font-normal text-muted-foreground">optional</span></Label>
                  <Input id={`${kind}-seed`} value={seed} onChange={(event) => setSeed(event.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="Random" className="h-10" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${kind}-prompt`}>Creative brief</Label>
                  <span className="text-[11px] text-muted-foreground">{prompt.length}/4000</span>
                </div>
                <div className="overflow-hidden rounded-xl border border-input bg-input/15 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
                  <Textarea
                    id={`${kind}-prompt`}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    minLength={3}
                    maxLength={4000}
                    required
                    placeholder={examples[0]}
                    className="min-h-32 resize-y rounded-none border-0 bg-transparent px-4 py-3 leading-6 shadow-none focus-visible:ring-0"
                  />
                  <div className="flex items-center justify-between border-t border-border p-2">
                    <Select value={agentId} onValueChange={selectAgent} disabled={!hasPaidSubscription}>
                      <SelectTrigger aria-label="Select AI model agent" className="h-9 w-[220px] border-border bg-card text-xs">
                        <Bot className="size-3.5 text-primary" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start" className="w-[300px]">
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <span className="font-medium">{agent.label}</span>
                            <span className="ml-2 text-[10px] text-muted-foreground">{agent.tag}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="pr-2 text-[10px] text-muted-foreground">
                      {hasPaidSubscription ? "Approved model agent" : "Models unlock with a plan"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {examples.slice(1).map((example, index) => (
                    <button key={example} type="button" onClick={() => setPrompt(example)} className="rounded-full border border-border bg-card/65 px-3 py-1.5 text-left text-[11px] text-muted-foreground transition hover:border-primary/25 hover:text-foreground">
                      Try direction {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Model intent</Label>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {profiles.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={profile === item.value}
                      disabled={!hasPaidSubscription}
                      onClick={() => setProfile(item.value)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                        profile === item.value ? "border-primary/35 bg-primary/[0.08]" : "border-border bg-muted/55 hover:border-primary/20",
                      )}
                    >
                      <item.icon className={cn("mb-4 size-4 text-muted-foreground", profile === item.value && "text-primary")} />
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p>
                    </button>
                  ))}
                </div>
              </div>

              {isImage ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Art direction</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Autopilot</SelectItem>
                        <SelectItem value="photoreal">Photoreal</SelectItem>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                        <SelectItem value="editorial">Editorial</SelectItem>
                        <SelectItem value="product">Product campaign</SelectItem>
                        <SelectItem value="illustration">Illustration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Canvas</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landscape_16_9">Landscape 16:9</SelectItem>
                        <SelectItem value="landscape_4_3">Landscape 4:3</SelectItem>
                        <SelectItem value="square_hd">Square</SelectItem>
                        <SelectItem value="portrait_4_3">Portrait 3:4</SelectItem>
                        <SelectItem value="portrait_16_9">Portrait 9:16</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-end justify-between gap-4">
                      <div><Label>Visual style</Label><p className="mt-1 text-xs text-muted-foreground">Direct the model&apos;s world, character treatment, color and finish.</p></div>
                      <Badge variant="secondary" className="hidden sm:inline-flex">Applied to prompt</Badge>
                    </div>
                    <div className="mt-3"><VideoStylePicker value={visualStyle} onChange={setVisualStyle} /></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2"><Label>Camera</Label><Select value={cameraMotion} onValueChange={setCameraMotion}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Autopilot</SelectItem><SelectItem value="static">Locked camera</SelectItem><SelectItem value="dolly-in">Dolly in</SelectItem><SelectItem value="orbit">Orbit</SelectItem><SelectItem value="handheld">Cinematic handheld</SelectItem><SelectItem value="drone">Drone</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Mood</Label><Select value={mood} onValueChange={setMood}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Autopilot</SelectItem><SelectItem value="cinematic">Cinematic</SelectItem><SelectItem value="energetic">Energetic</SelectItem><SelectItem value="dreamy">Dreamy</SelectItem><SelectItem value="documentary">Documentary</SelectItem><SelectItem value="luxury">Luxury</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Frame</Label><Select value={aspectRatio} onValueChange={setAspectRatio}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="16:9">Landscape 16:9</SelectItem><SelectItem value="9:16">Vertical 9:16</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Duration</Label><Select value={duration} onValueChange={(value) => setDuration(value as VideoDuration)}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent>{availableDurations.map((value) => <SelectItem key={value} value={value}>{Number.parseInt(value, 10)} seconds</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Resolution</Label><Select value={resolution} onValueChange={(value) => setResolution(value as VideoResolution)}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent>{availableResolutions.map((value) => <SelectItem key={value} value={value}>{selectedVideoAgent?.id === "kling-3-pro" ? "Provider-managed HD" : value === "720p" ? "720p efficient" : value === "1080p" ? "1080p production" : "4K premium"}</SelectItem>)}</SelectContent></Select></div>
                    <div className="flex h-[66px] items-end"><div className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-input/20 px-3"><span className="inline-flex items-center gap-2 text-sm"><AudioLines className="size-4 text-primary" /> Native audio</span><Switch checked={generateAudio} onCheckedChange={setGenerateAudio} aria-label="Generate synchronized audio" /></div></div>
                  </div>
                </div>
              )}

              {error && <Alert variant="destructive"><CircleAlert className="size-4" /><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-md text-xs leading-5 text-muted-foreground">
                  {!hasPaidSubscription
                      ? "Sign in and choose a paid plan to unlock model selection and generation."
                      : agentId === "auto"
                        ? "Autopilot makes a fresh routing decision for every brief and preserves the reason with your result."
                        : "Your selected agent is allowlisted on the server and recorded with the result."}
                </p>
                <Button type="submit" size="lg" disabled={submitting || !prompt.trim() || !name.trim()} className="h-11 px-6">
                  {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
                  {submitting
                    ? "Queuing…"
                    : !isAuthenticated
                      ? `Sign in to generate ${kind}`
                      : !hasPaidSubscription
                        ? `Choose a plan to generate ${kind}`
                        : `Generate ${kind}`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <ModelAutopilot generation={selected} />
          <Card className="overflow-hidden border-border bg-card/70">
            {selected ? (
              <>
                <div className="group relative overflow-hidden bg-black/25">
                  <MediaPreview generation={selected} kind={kind} />
                  <div className="absolute left-3 top-3"><GenerationStatus generation={selected} /></div>
                  {selected.status !== "completed" && (
                    <DismissProcessButton
                      endpoint={`/api/generations/${selected.id}`}
                      label={`${["processing", "queued", "retrying"].includes(selected.status) ? "Cancel and remove" : "Remove"} ${selected.name}`}
                      onDismiss={() => dismissGeneration(selected.id)}
                      onError={setError}
                      className="absolute right-3 top-3"
                    />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{selected.name}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{selected.prompt}</p></div>
                    {selected.outputUrl && <Button size="icon" variant="outline" asChild><a href={selected.outputUrl} target="_blank" rel="noreferrer" aria-label={`Download ${selected.name}`}><ArrowDownToLine className="size-4" /></a></Button>}
                  </div>
                  {selected.last_error && <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs leading-5 text-red-300">{selected.last_error}</p>}
                </CardContent>
              </>
            ) : (
              <div className="relative min-h-80 overflow-hidden">
                <Image src={isImage ? aiImageVisual : aiVideoVisual} alt="" fill placeholder="blur" sizes="(max-width: 1280px) 100vw, 34vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
                <CardContent className="relative grid min-h-80 place-items-end p-6 text-center">
                  <div className="mx-auto max-w-xs"><Aperture className="mx-auto size-7 text-primary" /><p className="mt-4 text-sm font-medium">Your first {kind} starts here</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Write a creative brief and Model Autopilot will take it from there.</p></div>
                </CardContent>
              </div>
            )}
          </Card>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><h2 className="text-xl font-semibold tracking-[-0.025em]">Recent {kind}s</h2><p className="mt-1 text-sm text-muted-foreground">Private generations and their routing decisions.</p></div>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><RefreshCw className={cn("size-3", activeIds && "animate-spin")} /> {activeIds ? "Live updates" : `${generations.length} total`}</span>
        </div>
        {generations.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {generations.map((generation) => (
              <div key={generation.id} className={cn("group relative overflow-hidden rounded-xl border bg-card/65 transition hover:border-primary/25", selected?.id === generation.id ? "border-primary/35" : "border-border")}>
                <button type="button" aria-pressed={selected?.id === generation.id} onClick={() => setSelectedId(generation.id)} className="block w-full text-left">
                  <div className="relative overflow-hidden"><MediaPreview controls={false} generation={generation} kind={kind} /><div className="absolute left-2.5 top-2.5"><GenerationStatus generation={generation} /></div></div>
                  <div className="p-3"><p className="truncate text-sm font-medium">{generation.name}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{generation.model_endpoint ?? "Autopilot selecting model"}</p></div>
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
        ) : (
          <Card className="border-dashed bg-card/35"><CardContent className="grid min-h-44 place-items-center p-8 text-center"><div><Sparkles className="mx-auto size-5 text-primary" /><p className="mt-3 text-sm">No {kind}s generated yet.</p></div></CardContent></Card>
        )}
      </section>
    </main>
  );
}
