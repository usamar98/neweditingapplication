"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Captions,
  Bot,
  Check,
  CircleAlert,
  Download,
  Film,
  Loader2,
  Maximize2,
  Palette,
  Pause,
  Play,
  Ratio,
  Save,
  Scissors,
  Sparkles,
  Type,
  Volume2,
  WandSparkles,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DismissProcessButton } from "@/components/dismiss-process-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoStylePicker } from "@/components/video-style-picker";
import {
  editSettingsSchema,
  type EditSettings,
  type TranscriptSegment,
} from "@/lib/domain/video";
import { editorAgents, type EditorAgentId } from "@/lib/domain/ai-models";
import { videoVisualStyleById } from "@/lib/domain/video-styles";
import type { ProjectEditorData } from "@/lib/data/projects";
import { formatDuration } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.generated";

type Job = Tables<"jobs">;

const aspectOptions = [
  { label: "Original", value: "original", detail: "Source frame" },
  { label: "TikTok", value: "tiktok", detail: "9:16" },
  { label: "Instagram Reel", value: "instagram-reel", detail: "9:16" },
  { label: "Instagram Post", value: "instagram-square", detail: "1:1" },
  { label: "YouTube", value: "youtube", detail: "16:9" },
] as const;

const playerRatios: Record<EditSettings["aspectRatio"], string> = {
  "instagram-reel": "aspect-[9/16] max-h-[62vh]",
  "instagram-square": "aspect-square max-h-[62vh]",
  original: "aspect-video",
  tiktok: "aspect-[9/16] max-h-[62vh]",
  youtube: "aspect-video",
};

const captionPositions = {
  bottom: "bottom-[8%]",
  middle: "top-1/2 -translate-y-1/2",
  top: "top-[8%]",
} as const;

function hexToRgba(hex: string, opacity: number) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  return body?.error?.message ?? "The request failed. Please try again.";
}

function JobProgress({ job, onDismiss, onError }: { job: Job; onDismiss: () => void; onError: (message: string) => void }) {
  const failed = job.status === "failed";
  return (
    <div className={cn("rounded-xl border border-primary/15 bg-primary/[0.045] p-4", failed && "border-destructive/20 bg-destructive/[0.045]")}> 
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className={cn("mt-0.5 grid size-8 place-items-center rounded-lg bg-primary/10 text-primary", failed && "bg-destructive/10 text-red-300")}>
            {failed ? <CircleAlert className="size-4" /> : job.status === "completed" ? <Check className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
          </span>
          <div><p className="text-sm font-medium">{job.kind === "analyze" ? "AI video analysis" : "MP4 export"}</p><p className="mt-1 text-xs text-muted-foreground">{failed ? job.error_message ?? "Processing failed" : job.stage}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{job.progress}%</span>
          <DismissProcessButton
            endpoint={`/api/jobs/${job.id}`}
            label={`${["queued", "processing", "retrying"].includes(job.status) ? "Cancel and remove" : "Remove"} ${job.kind === "analyze" ? "video analysis" : "video export"}`}
            onDismiss={onDismiss}
            onError={onError}
          />
        </div>
      </div>
      <Progress className={cn("mt-3 h-1.5", failed && "[&_[data-slot=progress-indicator]]:bg-destructive")} value={job.progress} />
    </div>
  );
}

function TranscriptList({
  currentTime,
  onSeek,
  segments,
}: {
  currentTime: number;
  onSeek: (seconds: number) => void;
  segments: TranscriptSegment[];
}) {
  if (segments.length === 0) {
    return <div className="grid min-h-44 place-items-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Transcript appears after analysis completes.</div>;
  }
  return (
    <ScrollArea className="h-[330px] pr-3">
      <div className="space-y-1">
        {segments.map((segment) => {
          const active = currentTime >= segment.start && currentTime <= segment.end;
          return (
            <button key={segment.id} type="button" onClick={() => onSeek(segment.start)} className={cn("w-full rounded-lg px-3 py-2.5 text-left text-sm leading-6 transition hover:bg-muted", active && "bg-primary/10 text-foreground")}>
              <span className="mr-3 font-mono text-[10px] text-primary">{formatDuration(segment.start)}</span>{segment.text}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function AIClipper({ project }: { project: ProjectEditorData }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const completionRefreshRef = useRef<string | null>(null);
  const [jobs, setJobs] = useState(project.jobs);
  const [settings, setSettings] = useState<EditSettings>(project.editSettings);
  const [mediaDuration, setMediaDuration] = useState(Math.max(project.duration, 0.1));
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [editorAgentId, setEditorAgentId] = useState<EditorAgentId>("auto");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [realtimeState, setRealtimeState] = useState<"connecting" | "live" | "degraded">("connecting");

  const activeJob = useMemo(
    () => jobs.find((job) => !job.dismissed_at && ["queued", "processing", "retrying"].includes(job.status))
      ?? jobs.find((job) => !job.dismissed_at && job.status === "failed"),
    [jobs],
  );
  const endTime = settings.trimEnd ?? mediaDuration;
  const activeVisualStyle = videoVisualStyleById(settings.visualStyle);
  const activeCaption = useMemo(
    () => project.transcript.segments.find((segment) => currentTime >= segment.start && currentTime <= segment.end),
    [currentTime, project.transcript.segments],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = settings.audio.muted;
    video.volume = Math.min(1, settings.audio.volume);
  }, [settings.audio.muted, settings.audio.volume]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`project-jobs-${project.id}`)
      .on(
        "postgres_changes",
        { event: "*", filter: `project_id=eq.${project.id}`, schema: "public", table: "jobs" },
        (payload) => {
          const nextJob = payload.new as Job;
          if (!nextJob?.id) return;
          setJobs((current) => {
            if (nextJob.dismissed_at) return current.filter((job) => job.id !== nextJob.id);
            const exists = current.some((job) => job.id === nextJob.id);
            return exists ? current.map((job) => (job.id === nextJob.id ? nextJob : job)) : [nextJob, ...current];
          });
          if (["completed", "failed"].includes(nextJob.status) && completionRefreshRef.current !== nextJob.id) {
            completionRefreshRef.current = nextJob.id;
            setTimeout(() => router.refresh(), 500);
          }
        },
      )
      .subscribe((status) => setRealtimeState(status === "SUBSCRIBED" ? "live" : status === "CHANNEL_ERROR" ? "degraded" : "connecting"));

    return () => { void supabase.removeChannel(channel); };
  }, [project.id, router]);

  function updateSettings<K extends keyof EditSettings>(key: K, value: EditSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }

  function dismissJob(jobId: string) {
    setJobs((current) => current.filter((job) => job.id !== jobId));
    setNotice("Process removed.");
  }

  function seek(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(seconds, settings.trimStart), endTime);
    setCurrentTime(video.currentTime);
  }

  function selectHighlight(highlight: { end: number; start: number }) {
    const trimStart = Math.max(0, Math.min(highlight.start, mediaDuration - 0.1));
    const trimEnd = Math.max(trimStart + 0.1, Math.min(highlight.end, mediaDuration));
    setSettings((current) => ({ ...current, trimEnd, trimStart }));
    if (videoRef.current) {
      videoRef.current.currentTime = trimStart;
      setCurrentTime(trimStart);
    }
    setNotice(`Moment selected · ${formatDuration(trimStart)}–${formatDuration(trimEnd)}`);
    document.getElementById("clip-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.currentTime < settings.trimStart || video.currentTime >= endTime) video.currentTime = settings.trimStart;
      void video.play();
    } else {
      video.pause();
    }
  }

  async function saveSettings(showNotice = true) {
    setSaving(true);
    setError(null);
    try {
      const validSettings = editSettingsSchema.parse(settings);
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validSettings),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      if (showNotice) setNotice("Changes saved");
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save changes.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function requestExport() {
    setExporting(true);
    setError(null);
    setNotice(null);
    try {
      if (!(await saveSettings(false))) return;
      const response = await fetch(`/api/projects/${project.id}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "export" }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const data = (await response.json()) as { job: Job };
      setJobs((current) => [data.job, ...current]);
      setNotice("Clip export queued. You can keep refining it while it runs.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Unable to start the export.");
    } finally {
      setExporting(false);
    }
  }

  async function requestAnalysis() {
    setAnalyzing(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/projects/${project.id}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: editorAgentId, kind: "analyze" }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const data = (await response.json()) as { job: Job };
      setJobs((current) => [data.job, ...current]);
      setNotice("AI moment detection queued with your selected analysis model.");
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Unable to start AI analysis.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1680px] px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Film className="size-3.5" /> AI Clipper project <span>·</span><span className={cn("inline-flex items-center gap-1.5", realtimeState === "live" && "text-primary")}><span className={cn("size-1.5 rounded-full bg-muted-foreground", realtimeState === "live" && "bg-primary", realtimeState === "connecting" && "animate-pulse")} /> {realtimeState === "live" ? "Live" : realtimeState === "degraded" ? "Reconnecting" : "Connecting"}</span></div>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-0.035em]">{project.name}</h1>
          <p className="mt-1 truncate text-xs text-muted-foreground">{project.sourceFilename} · {formatDuration(mediaDuration)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {notice && <span className="mr-2 text-xs text-primary">{notice}</span>}
          <Select value={editorAgentId} onValueChange={(value) => setEditorAgentId(value as EditorAgentId)}>
            <SelectTrigger aria-label="Select AI clip analysis model" className="h-9 w-[210px] bg-card/60 text-xs">
              <Bot className="size-3.5 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="w-[310px]">
              {editorAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <span className="font-medium">{agent.label}</span>
                  <span className="ml-2 text-[10px] text-muted-foreground">{agent.tag}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={requestAnalysis} disabled={analyzing || Boolean(activeJob && ["queued", "processing", "retrying"].includes(activeJob.status))}>
            {analyzing ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />} {analyzing ? "Queueing" : "Find moments"}
          </Button>
          <Button variant="outline" onClick={() => void saveSettings()} disabled={saving || exporting}><Save className="size-4" /> {saving ? "Saving" : "Save"}</Button>
          {project.exportUrl && <Button variant="outline" asChild><a href={project.exportUrl} target="_blank" rel="noreferrer"><Download className="size-4" /> Download latest clip</a></Button>}
          <Button onClick={requestExport} disabled={exporting || saving || project.duration <= 0}><Download className="size-4" /> {exporting ? "Queueing" : "Export clip"}</Button>
        </div>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><CircleAlert className="size-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      {activeJob && <div className="mb-4"><JobProgress job={activeJob} onDismiss={() => dismissJob(activeJob.id)} onError={setError} /></div>}

      <div id="clip-preview" className="scroll-mt-24 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
        <section className="min-w-0 space-y-4">
          <Card className="overflow-hidden border-border bg-card/70">
            <CardContent className="p-0">
              <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-black p-3 sm:p-5">
                <div className={cn("relative w-full max-w-full overflow-hidden rounded-lg bg-black shadow-2xl shadow-black/60", playerRatios[settings.aspectRatio])}>
                  {project.previewUrl ? (
                    <video
                      ref={videoRef}
                      src={project.previewUrl}
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover transition-[filter] duration-300"
                      style={{ filter: activeVisualStyle.previewFilter }}
                      onLoadedMetadata={(event) => { const duration = event.currentTarget.duration; if (Number.isFinite(duration)) setMediaDuration(duration); }}
                      onPlay={() => setPlaying(true)}
                      onPause={() => setPlaying(false)}
                      onTimeUpdate={(event) => { const time = event.currentTarget.currentTime; setCurrentTime(time); if (time >= endTime) { event.currentTarget.pause(); event.currentTarget.currentTime = settings.trimStart; } }}
                    />
                  ) : (
                    <div className="grid min-h-[300px] place-items-center px-6 text-center">
                      <div>
                        <Loader2 className="mx-auto size-6 animate-spin text-primary" />
                        <p className="mt-4 text-sm font-medium text-white">Securing your video source</p>
                        <p className="mt-1 text-xs text-white/60">The preview will appear after the linked video is safely imported.</p>
                      </div>
                    </div>
                  )}
                  {project.previewUrl && settings.captions.enabled && activeCaption && (
                    <div className={cn("pointer-events-none absolute inset-x-4 flex justify-center", captionPositions[settings.captions.position])}>
                      <span className="max-w-[88%] rounded px-2.5 py-1.5 text-center font-semibold leading-snug shadow-xl" style={{ backgroundColor: hexToRgba(settings.captions.backgroundColor, settings.captions.backgroundOpacity), color: settings.captions.textColor, fontFamily: settings.captions.font, fontSize: Math.max(13, settings.captions.fontSize * 0.45) }}>{activeCaption.text}</span>
                    </div>
                  )}
                  <button type="button" onClick={togglePlayback} className="absolute inset-0 grid place-items-center opacity-0 transition hover:opacity-100 focus-visible:opacity-100" aria-label={playing ? "Pause video" : "Play video"}><span className="grid size-12 place-items-center rounded-full border border-white/15 bg-black/45 backdrop-blur">{playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}</span></button>
                </div>
              </div>
              <div className="border-t border-border p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="secondary" onClick={togglePlayback} aria-label={playing ? "Pause video" : "Play video"}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
                  <span className="w-24 font-mono text-xs text-muted-foreground">{formatDuration(currentTime)} / {formatDuration(endTime)}</span>
                  <div className="relative h-10 min-w-0 flex-1 rounded-lg bg-muted/60">
                    <div className="absolute inset-y-0 bg-primary/10" style={{ left: `${(settings.trimStart / mediaDuration) * 100}%`, right: `${100 - (endTime / mediaDuration) * 100}%` }} />
                    {project.analysis.scenes.map((scene, index) => <button key={`${scene.start}-${index}`} type="button" aria-label={`Jump to scene ${index + 1}`} onClick={() => seek(scene.start)} className="absolute inset-y-1 w-px bg-primary/60 transition hover:w-1" style={{ left: `${(scene.start / mediaDuration) * 100}%` }} />)}
                    <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${(currentTime / mediaDuration) * 100}%` }} />
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => videoRef.current?.requestFullscreen()} aria-label="Enter fullscreen"><Maximize2 className="size-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/70">
            <CardHeader className="pb-4"><div className="flex items-center justify-between"><CardTitle className="text-sm">Selected clip range</CardTitle><span className="font-mono text-xs text-muted-foreground">{formatDuration(settings.trimStart)} — {formatDuration(endTime)}</span></div></CardHeader>
            <CardContent className="space-y-5">
              <Slider value={[settings.trimStart, endTime]} min={0} max={mediaDuration} step={0.1} minStepsBetweenThumbs={1} onValueChange={(value) => setSettings((current) => ({ ...current, trimStart: value[0], trimEnd: value[1] }))} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="trim-start">Start (seconds)</Label><Input id="trim-start" type="number" min={0} max={endTime - 0.1} step="0.1" value={settings.trimStart.toFixed(1)} onChange={(event) => updateSettings("trimStart", Number(event.target.value))} /></div>
                <div className="space-y-2"><Label htmlFor="trim-end">End (seconds)</Label><Input id="trim-end" type="number" min={settings.trimStart + 0.1} max={mediaDuration} step="0.1" value={endTime.toFixed(1)} onChange={(event) => updateSettings("trimEnd", Number(event.target.value))} /></div>
              </div>
              {project.analysis.scenes.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1">{project.analysis.scenes.slice(0, 14).map((scene, index) => <Button key={`${scene.start}-${index}`} size="sm" variant="secondary" onClick={() => seek(scene.start)} className="shrink-0 font-mono text-[11px]">S{index + 1} · {formatDuration(scene.start)}</Button>)}</div>}
            </CardContent>
          </Card>
        </section>

        <aside className="min-w-0">
          <Card className="border-border bg-card/70 xl:sticky xl:top-20">
            <Tabs defaultValue="style">
              <CardHeader className="pb-3"><TabsList className="grid w-full grid-cols-6"><TabsTrigger value="style" aria-label="Visual style"><Palette className="size-4" /></TabsTrigger><TabsTrigger value="captions" aria-label="Captions"><Type className="size-4" /></TabsTrigger><TabsTrigger value="cleanup" aria-label="Cleanup"><Scissors className="size-4" /></TabsTrigger><TabsTrigger value="format" aria-label="Format"><Ratio className="size-4" /></TabsTrigger><TabsTrigger value="audio" aria-label="Audio"><Volume2 className="size-4" /></TabsTrigger><TabsTrigger value="transcript" aria-label="Transcript"><Captions className="size-4" /></TabsTrigger></TabsList></CardHeader>
              <CardContent className="pt-1">
                <TabsContent value="style" className="mt-0 space-y-5">
                  <div><p className="text-sm font-medium">Visual style</p><p className="mt-1 text-xs text-muted-foreground">Preview a look instantly and bake it into the exported MP4.</p></div>
                  <VideoStylePicker compact value={settings.visualStyle} onChange={(visualStyle) => updateSettings("visualStyle", visualStyle)} />
                  <Alert><Palette className="size-4" /><AlertDescription>{activeVisualStyle.label} is applied non-destructively. Your private source video remains unchanged.</AlertDescription></Alert>
                </TabsContent>
                <TabsContent value="captions" className="mt-0 space-y-5">
                  <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Automatic captions</p><p className="mt-1 text-xs text-muted-foreground">Burn styled captions into the export.</p></div><Switch checked={settings.captions.enabled} onCheckedChange={(enabled) => setSettings((current) => ({ ...current, captions: { ...current.captions, enabled } }))} /></div>
                  <Separator />
                  <div className="space-y-2"><Label>Typeface</Label><Select value={settings.captions.font} onValueChange={(font: EditSettings["captions"]["font"]) => setSettings((current) => ({ ...current, captions: { ...current.captions, font } }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Inter", "Arial", "Montserrat", "Roboto"].map((font) => <SelectItem key={font} value={font}>{font}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-3"><div className="flex justify-between"><Label>Text size</Label><span className="font-mono text-xs text-muted-foreground">{settings.captions.fontSize}px</span></div><Slider min={18} max={96} step={1} value={[settings.captions.fontSize]} onValueChange={([fontSize]) => setSettings((current) => ({ ...current, captions: { ...current.captions, fontSize } }))} /></div>
                  <div className="space-y-2"><Label>Position</Label><Select value={settings.captions.position} onValueChange={(position: EditSettings["captions"]["position"]) => setSettings((current) => ({ ...current, captions: { ...current.captions, position } }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="top">Top</SelectItem><SelectItem value="middle">Middle</SelectItem><SelectItem value="bottom">Bottom</SelectItem></SelectContent></Select></div>
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="text-color">Text</Label><Input id="text-color" type="color" className="h-10 p-1" value={settings.captions.textColor} onChange={(event) => setSettings((current) => ({ ...current, captions: { ...current.captions, textColor: event.target.value.toUpperCase() } }))} /></div><div className="space-y-2"><Label htmlFor="bg-color">Background</Label><Input id="bg-color" type="color" className="h-10 p-1" value={settings.captions.backgroundColor} onChange={(event) => setSettings((current) => ({ ...current, captions: { ...current.captions, backgroundColor: event.target.value.toUpperCase() } }))} /></div></div>
                  <div className="space-y-3"><div className="flex justify-between"><Label>Background opacity</Label><span className="font-mono text-xs text-muted-foreground">{Math.round(settings.captions.backgroundOpacity * 100)}%</span></div><Slider min={0} max={1} step={0.01} value={[settings.captions.backgroundOpacity]} onValueChange={([backgroundOpacity]) => setSettings((current) => ({ ...current, captions: { ...current.captions, backgroundOpacity } }))} /></div>
                </TabsContent>

                <TabsContent value="cleanup" className="mt-0 space-y-5">
                  <div><p className="text-sm font-medium">Smart cleanup</p><p className="mt-1 text-xs text-muted-foreground">Apply AI-detected removals during export.</p></div>
                  <div className="space-y-3"><div className="flex items-center justify-between rounded-xl border p-3"><div><p className="text-sm">Remove silence</p><p className="mt-1 text-xs text-muted-foreground">{project.analysis.silences.length} suggestions</p></div><Switch checked={settings.removeSilences} onCheckedChange={(value) => updateSettings("removeSilences", value)} /></div><div className="flex items-center justify-between rounded-xl border p-3"><div><p className="text-sm">Remove filler words</p><p className="mt-1 text-xs text-muted-foreground">{project.analysis.fillers.length} suggestions</p></div><Switch checked={settings.removeFillers} onCheckedChange={(value) => updateSettings("removeFillers", value)} /></div></div>
                  <Separator />
                  <div><div className="mb-3 flex items-center justify-between"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Suggested cuts</p><Badge variant="secondary">{project.analysis.silences.length + project.analysis.fillers.length}</Badge></div><ScrollArea className="h-[230px]"><div className="space-y-2 pr-3">{[...project.analysis.silences.map((item) => ({ ...item, label: "Silence" })), ...project.analysis.fillers.map((item) => ({ ...item, label: `Filler · ${item.text}` }))].sort((a, b) => a.start - b.start).map((item, index) => <button key={`${item.start}-${index}`} type="button" onClick={() => seek(item.start)} className="flex w-full items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-left text-xs transition hover:bg-muted"><span>{item.label}</span><span className="font-mono text-muted-foreground">{formatDuration(item.start)}–{formatDuration(item.end)}</span></button>)}{project.analysis.silences.length + project.analysis.fillers.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">Suggestions appear after analysis.</p>}</div></ScrollArea></div>
                </TabsContent>

                <TabsContent value="format" className="mt-0 space-y-5">
                  <div><p className="text-sm font-medium">Platform format</p><p className="mt-1 text-xs text-muted-foreground">Scale and crop the exported video.</p></div>
                  <div className="space-y-2">{aspectOptions.map((option) => <button key={option.value} type="button" onClick={() => updateSettings("aspectRatio", option.value)} className={cn("flex w-full items-center justify-between rounded-xl border p-3 text-left transition hover:bg-muted/50", settings.aspectRatio === option.value && "border-primary/25 bg-primary/[0.06]")}><span><span className="block text-sm">{option.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{option.detail}</span></span>{settings.aspectRatio === option.value && <Check className="size-4 text-primary" />}</button>)}</div>
                  <Alert><Ratio className="size-4" /><AlertDescription>The worker uses a center crop after scaling to preserve quality. Source files remain untouched.</AlertDescription></Alert>
                </TabsContent>

                <TabsContent value="audio" className="mt-0 space-y-5">
                  <div><p className="text-sm font-medium">Audio controls</p><p className="mt-1 text-xs text-muted-foreground">Preview volume now and apply it to export.</p></div>
                  <div className="flex items-center justify-between rounded-xl border p-3"><div><p className="text-sm">Mute track</p><p className="mt-1 text-xs text-muted-foreground">Export video without audio.</p></div><Switch checked={settings.audio.muted} onCheckedChange={(muted) => setSettings((current) => ({ ...current, audio: { ...current.audio, muted } }))} /></div>
                  <div className="space-y-3"><div className="flex justify-between"><Label>Volume</Label><span className="font-mono text-xs text-muted-foreground">{Math.round(settings.audio.volume * 100)}%</span></div><Slider min={0} max={2} step={0.05} value={[settings.audio.volume]} onValueChange={([volume]) => setSettings((current) => ({ ...current, audio: { ...current.audio, volume } }))} /></div>
                  <div className="flex items-center justify-between rounded-xl border p-3"><div><p className="text-sm">Noise reduction</p><p className="mt-1 text-xs text-muted-foreground">FFmpeg frequency cleanup.</p></div><Switch checked={settings.audio.noiseReduction} onCheckedChange={(noiseReduction) => setSettings((current) => ({ ...current, audio: { ...current.audio, noiseReduction } }))} /></div>
                </TabsContent>

                <TabsContent value="transcript" className="mt-0 space-y-4">
                  <div className="flex items-start justify-between"><div><p className="text-sm font-medium">Transcript</p><p className="mt-1 text-xs text-muted-foreground">{project.transcript.language ? `Detected ${project.transcript.language}` : "Timed speech segments"}</p></div><Badge variant="secondary">{project.transcript.segments.length}</Badge></div>
                  <TranscriptList currentTime={currentTime} onSeek={seek} segments={project.transcript.segments} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </aside>
      </div>

      {project.analysis.highlights.length > 0 && (
        <Card className="mt-4 border-border bg-card/70"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-primary" /> Best moments selected by AI</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{project.analysis.highlights.map((highlight, index) => <button key={`${highlight.start}-${index}`} type="button" onClick={() => selectHighlight(highlight)} className="rounded-xl border border-border bg-muted/55 p-4 text-left transition hover:border-primary/20 hover:bg-primary/[0.035]"><div className="flex items-center justify-between"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><WandSparkles className="size-4" /></span><span className="font-mono text-[10px] text-muted-foreground">{formatDuration(highlight.start)}–{formatDuration(highlight.end)}</span></div><p className="mt-4 text-sm font-medium">Moment {index + 1}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{highlight.reason}</p><span className="mt-4 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">Use this moment</span></button>)}</CardContent></Card>
      )}
    </main>
  );
}
