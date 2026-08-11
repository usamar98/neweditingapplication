"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  Bot,
  Camera,
  Check,
  CircleAlert,
  Clapperboard,
  Link2,
  LoaderCircle,
  Megaphone,
  MessageSquare,
  Music2,
  Play,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { WelcomeCreditsCard } from "@/components/welcome-credits-card";
import type { CreditSummary } from "@/lib/credits";
import type { GenerationView } from "@/lib/data/generations";
import type { ProjectListItem } from "@/lib/data/projects";
import {
  performanceCreativeAgentsForSource,
  type PerformanceCreativeSourceType,
} from "@/lib/domain/ai-models";
import {
  performanceCreativePlatformPresets,
  type PerformanceCreativePlatform,
} from "@/lib/domain/generation";
import { cn } from "@/lib/utils";
import type { Json, Tables } from "@/types/database.generated";

type CreativePlan = {
  callToAction: string;
  endSeconds?: number;
  headline: string;
  hook: string;
  rationale: string;
  script: string;
  startSeconds?: number;
  visualDirection: string;
};

type CreativeSettings = {
  creativePlan?: CreativePlan;
  platform?: PerformanceCreativePlatform;
  source?: { projectId?: string; type?: PerformanceCreativeSourceType; url?: string };
  sourceProjectName?: string;
};

const platformOptions = [
  { id: "facebook" as const, icon: MessageSquare, accent: "text-blue-300" },
  { id: "instagram" as const, icon: Camera, accent: "text-pink-300" },
  { id: "tiktok" as const, icon: Music2, accent: "text-cyan-200" },
  { id: "youtube" as const, icon: Play, accent: "text-red-300" },
];

function settingsOf(value: Json): CreativeSettings {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as unknown as CreativeSettings
    : {};
}

async function apiMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  return payload?.error?.message ?? "The performance creative could not be started.";
}

function GenerationStatus({ generation }: { generation: GenerationView }) {
  const progress = generation.job?.progress ?? (generation.status === "completed" ? 100 : 0);
  if (generation.status === "completed") return <Badge className="bg-emerald-400/15 text-emerald-200"><Check className="size-3" /> Ready</Badge>;
  if (generation.status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return (
    <div className="min-w-32 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur">
      <div className="flex items-center justify-between text-[10px]"><span>{generation.job?.stage ?? "Queued"}</span><span>{progress}%</span></div>
      <Progress value={progress} className="mt-1.5 h-1" />
    </div>
  );
}

export function PerformanceCreativeStudio({
  initialCredits,
  initialGenerations,
  isAuthenticated,
  projects,
}: {
  initialCredits: CreditSummary | null;
  initialGenerations: GenerationView[];
  isAuthenticated: boolean;
  projects: ProjectListItem[];
}) {
  const router = useRouter();
  const [credits, setCredits] = useState(initialCredits);
  const hasPaidSubscription = credits?.active === true;
  const readyProjects = useMemo(
    () => projects.filter((project) => ["ready", "completed"].includes(project.status) && Number(project.duration_seconds ?? 0) >= 4),
    [projects],
  );
  const [sourceType, setSourceType] = useState<PerformanceCreativeSourceType>("product_url");
  const [productUrl, setProductUrl] = useState("");
  const [projectId, setProjectId] = useState(readyProjects[0]?.id ?? "");
  const [platform, setPlatform] = useState<PerformanceCreativePlatform>("instagram");
  const [duration, setDuration] = useState("8s");
  const [agentId, setAgentId] = useState("auto");
  const [name, setName] = useState("AI ad creative");
  const [audience, setAudience] = useState("Online shoppers who want a clear reason to act now");
  const [callToAction, setCallToAction] = useState("Shop now");
  const [prompt, setPrompt] = useState("Build a credible direct-response ad with a fast visual hook, one clear benefit, and a clean conversion moment.");
  const [generations, setGenerations] = useState(initialGenerations);
  const [selectedId, setSelectedId] = useState(initialGenerations[0]?.id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const agents = performanceCreativeAgentsForSource(sourceType);
  const selected = generations.find((generation) => generation.id === selectedId) ?? generations[0];
  const selectedSettings = selected ? settingsOf(selected.settings) : {};
  const selectedPlan = selectedSettings.creativePlan;
  const selectedPlatform = selectedSettings.platform
    ? performanceCreativePlatformPresets[selectedSettings.platform]
    : null;
  const activeIds = useMemo(
    () => generations
      .filter((generation) => ["processing", "queued", "retrying"].includes(generation.status))
      .map((generation) => generation.id)
      .join(","),
    [generations],
  );

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

  function chooseSource(nextSource: string) {
    const normalized = nextSource as PerformanceCreativeSourceType;
    setSourceType(normalized);
    setAgentId("auto");
    setDuration(normalized === "product_url" ? "8s" : "15s");
    setError(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/creative-studio")}`);
      return;
    }
    if (!hasPaidSubscription) {
      setError("AI ad creative generation requires an active paid subscription. Your welcome credits remain available for four default-model images.");
      return;
    }
    if (sourceType === "product_url" && !productUrl.trim()) {
      setError("Enter a public HTTPS product page URL.");
      return;
    }
    if (sourceType === "long_video" && !projectId) {
      setError("Choose an analyzed long-video project first.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/generations", {
        body: JSON.stringify({
          agentId,
          audience: audience.trim(),
          callToAction: callToAction.trim(),
          duration,
          kind: "performance_creative",
          name: name.trim(),
          platform,
          profile: agentId.includes("fast") ? "speed" : "quality",
          prompt: prompt.trim(),
          source: sourceType === "product_url"
            ? { type: "product_url", url: productUrl.trim() }
            : { projectId, type: "long_video" },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) throw new Error(await apiMessage(response));
      const result = (await response.json()) as { generation: Tables<"generations">; job: Tables<"jobs"> };
      const next: GenerationView = { ...result.generation, job: result.job, outputUrl: null };
      setGenerations((current) => [next, ...current]);
      setSelectedId(next.id);
      const creditResponse = await fetch("/api/billing/credits", { cache: "no-store" });
      if (creditResponse.ok) {
        const body = (await creditResponse.json()) as { credits: CreditSummary };
        setCredits(body.credits);
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to start the performance creative.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/70 px-5 py-7 sm:px-7">
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-primary/25 bg-primary/5 text-primary"><Megaphone className="size-3.5" /> AI ad creative generator</Badge>
            <h1 className="text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Turn product pages and long videos into ads built to perform.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">A source-aware agent plans the hook, selects a model, and delivers a private platform-ready video with its headline, script, CTA, and routing decision preserved.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {platformOptions.map((item) => {
              const preset = performanceCreativePlatformPresets[item.id];
              return <div key={item.id} className="rounded-xl border border-border bg-muted/55 p-3"><item.icon className={cn("size-4", item.accent)} /><p className="mt-3 text-xs font-medium">{preset.label}</p><p className="mt-1 text-[10px] text-muted-foreground">{preset.placement}</p></div>;
            })}
          </div>
        </div>
      </section>

      <WelcomeCreditsCard credits={credits} isAuthenticated={isAuthenticated} onCreditsChange={setCredits} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
        <Card className="border-border bg-card/70">
          <CardHeader><CardTitle className="text-lg">Build an AI ad creative</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-3">
                <Label>1. Choose the source</Label>
                <Tabs value={sourceType} onValueChange={chooseSource}>
                  <TabsList className="grid h-11 w-full grid-cols-2">
                    <TabsTrigger value="product_url"><Link2 className="size-4" /> Product URL</TabsTrigger>
                    <TabsTrigger value="long_video"><Clapperboard className="size-4" /> Long video</TabsTrigger>
                  </TabsList>
                </Tabs>
                {sourceType === "product_url" ? (
                  <div className="space-y-2">
                    <Label htmlFor="product-url">Public product page</Label>
                    <Input id="product-url" type="url" inputMode="url" value={productUrl} onChange={(event) => setProductUrl(event.target.value)} placeholder="https://your-store.com/products/hero-product" required />
                    <p className="text-[11px] leading-5 text-muted-foreground">The page must expose a product title and Open Graph or Product JSON-LD image. Private-network URLs are rejected.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Analyzed video project</Label>
                    {readyProjects.length ? (
                      <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Choose a video" /></SelectTrigger>
                        <SelectContent>{readyProjects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name} · {Math.round(Number(project.duration_seconds ?? 0))}s</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/55 p-5 text-center">
                        <Upload className="mx-auto size-5 text-primary" /><p className="mt-3 text-sm">Upload and analyze a long video first.</p>
                        <Button asChild variant="outline" size="sm" className="mt-4"><Link href={"/dashboard#new-project" as Route}>Upload long video</Link></Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>2. Choose the destination</Label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {platformOptions.map((item) => {
                    const preset = performanceCreativePlatformPresets[item.id];
                    return (
                      <button key={item.id} type="button" aria-pressed={platform === item.id} onClick={() => setPlatform(item.id)} className={cn("rounded-xl border p-3 text-left transition", platform === item.id ? "border-primary/35 bg-primary/[0.08]" : "border-border bg-muted/55 hover:border-primary/20")}>
                        <item.icon className={cn("size-4", platform === item.id ? "text-primary" : item.accent)} />
                        <p className="mt-3 text-sm font-medium">{preset.label}</p><p className="mt-1 text-[10px] text-muted-foreground">{preset.placement}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="creative-name">Creative name</Label><Input id="creative-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required /></div>
                <div className="space-y-2"><Label>Length</Label>{sourceType === "product_url" ? <Input value="8-second generated ad" readOnly className="text-muted-foreground" /> : <Select value={duration} onValueChange={setDuration}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15s">15-second short</SelectItem><SelectItem value="30s">30-second ad</SelectItem></SelectContent></Select>}</div>
                <div className="space-y-2"><Label htmlFor="creative-audience">Target audience</Label><Input id="creative-audience" value={audience} onChange={(event) => setAudience(event.target.value)} maxLength={500} required /></div>
                <div className="space-y-2"><Label htmlFor="creative-cta">Call to action</Label><Input id="creative-cta" value={callToAction} onChange={(event) => setCallToAction(event.target.value)} maxLength={120} required /></div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label htmlFor="performance-brief">3. Creative brief</Label><span className="text-[11px] text-muted-foreground">{prompt.length}/4000</span></div>
                <div className="overflow-hidden rounded-xl border border-input bg-input/15 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
                  <Textarea id="performance-brief" value={prompt} onChange={(event) => setPrompt(event.target.value)} minLength={3} maxLength={4000} required className="min-h-32 resize-y rounded-none border-0 bg-transparent px-4 py-3 leading-6 shadow-none focus-visible:ring-0" />
                  <div className="flex items-center justify-between border-t border-border p-2">
                    <Select value={agentId} onValueChange={setAgentId} disabled={!hasPaidSubscription}>
                      <SelectTrigger aria-label="Select AI ad creative model" className="h-9 w-[240px] border-border bg-card text-xs"><Bot className="size-3.5 text-primary" /><SelectValue /></SelectTrigger>
                      <SelectContent align="start" className="w-[330px]">{agents.map((agent) => <SelectItem key={agent.id} value={agent.id}><span className="font-medium">{agent.label}</span><span className="ml-2 text-[10px] text-muted-foreground">{agent.tag}</span></SelectItem>)}</SelectContent>
                    </Select>
                    <span className="pr-2 text-[10px] text-muted-foreground">{hasPaidSubscription ? "Source-aware agent" : "Models unlock with a plan"}</span>
                  </div>
                </div>
                <p className="text-[11px] leading-5 text-muted-foreground">{agents.find((agent) => agent.id === agentId)?.description}</p>
              </div>

              {error ? <Alert variant="destructive"><CircleAlert className="size-4" /><AlertDescription>{error}</AlertDescription></Alert> : null}
              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-md text-xs leading-5 text-muted-foreground">AI decisions and paid model results are checkpointed before private delivery, so a recoverable upload retry does not regenerate the creative.</p>
                <Button type="submit" size="lg" disabled={submitting || !name.trim() || !prompt.trim() || !audience.trim() || !callToAction.trim()} className="h-11 px-6">
                  {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {submitting ? "Queuing…" : !isAuthenticated ? "Sign in to create an ad" : !hasPaidSubscription ? "Choose a plan to create an ad" : "Create performance ad"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden border-border bg-card/70">
            {selected ? (
              <>
                <div className="relative aspect-[9/16] max-h-[620px] overflow-hidden bg-black/35">
                  {selected.outputUrl ? <video src={selected.outputUrl} controls playsInline className="size-full object-contain" /> : <div className="grid size-full min-h-96 place-items-center"><div className="text-center"><LoaderCircle className="mx-auto size-7 animate-spin text-primary" /><p className="mt-3 text-sm">{selected.job?.stage ?? "Creative agent is preparing"}</p></div></div>}
                  <div className="absolute left-3 top-3"><GenerationStatus generation={selected} /></div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{selected.name}</p><p className="mt-1 text-xs text-muted-foreground">{selectedPlatform ? `${selectedPlatform.label} · ${selectedPlatform.placement}` : "AI ad creative"}</p></div>{selected.outputUrl ? <Button size="icon" variant="outline" asChild><a href={selected.outputUrl} target="_blank" rel="noreferrer" aria-label={`Download ${selected.name}`}><ArrowDownToLine className="size-4" /></a></Button> : null}</div>
                  {selected.last_error ? <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs leading-5 text-red-300">{selected.last_error}</p> : null}
                </CardContent>
              </>
            ) : (
              <div className="grid min-h-[520px] place-items-center p-8 text-center"><div className="max-w-xs"><Megaphone className="mx-auto size-8 text-primary" /><p className="mt-4 text-sm font-medium">Your first AI ad creative starts here.</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Choose a source, platform, audience, and model agent.</p></div></div>
            )}
          </Card>
          {selectedPlan ? (
            <Card className="border-border bg-card/70"><CardHeader><CardTitle className="text-base">Conversion brief</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div><p className="text-[10px] uppercase tracking-[0.16em] text-primary">Hook</p><p className="mt-1 font-medium">{selectedPlan.hook}</p></div><div><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Headline</p><p className="mt-1">{selectedPlan.headline}</p></div><div><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Script</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{selectedPlan.script}</p></div><div className="rounded-xl border border-primary/15 bg-primary/5 p-3"><p className="text-[10px] uppercase tracking-[0.16em] text-primary">CTA</p><p className="mt-1 font-medium">{selectedPlan.callToAction}</p></div></CardContent></Card>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold tracking-[-0.025em]">Recent AI ad creatives</h2><p className="mt-1 text-sm text-muted-foreground">Private outputs with platform and model decisions preserved.</p></div><span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><RefreshCw className={cn("size-3", activeIds && "animate-spin")} /> {activeIds ? "Live updates" : `${generations.length} total`}</span></div>
        {generations.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{generations.map((generation) => { const itemSettings = settingsOf(generation.settings); const itemPlatform = itemSettings.platform ? performanceCreativePlatformPresets[itemSettings.platform] : null; return <button key={generation.id} type="button" aria-pressed={selected?.id === generation.id} onClick={() => setSelectedId(generation.id)} className={cn("overflow-hidden rounded-xl border bg-card/65 text-left transition hover:border-primary/25", selected?.id === generation.id ? "border-primary/35" : "border-border")}><div className="relative aspect-video bg-black/30">{generation.outputUrl ? <video src={generation.outputUrl} muted playsInline preload="metadata" className="size-full object-cover" /> : <div className="grid size-full place-items-center"><LoaderCircle className="size-5 animate-spin text-primary" /></div>}<div className="absolute left-2.5 top-2.5"><GenerationStatus generation={generation} /></div></div><div className="p-3"><p className="truncate text-sm font-medium">{generation.name}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{itemPlatform?.label ?? "Platform"} · {generation.model_endpoint ?? "Agent selecting"}</p></div></button>; })}</div>
        ) : <Card className="border-dashed bg-card/35"><CardContent className="grid min-h-44 place-items-center p-8 text-center"><div><Megaphone className="mx-auto size-5 text-primary" /><p className="mt-3 text-sm">No AI ad creatives yet.</p></div></CardContent></Card>}
      </section>
    </main>
  );
}
