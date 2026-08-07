import Link from "next/link";
import {
  ArrowRight,
  Captions,
  Check,
  Clock3,
  Download,
  Film,
  Ratio,
  Scissors,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles,
  Zap,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const workflow = [
  { icon: Upload, label: "Resumable upload", detail: "Large files continue where they left off." },
  { icon: WandSparkles, label: "AI-assisted analysis", detail: "Scenes, speech, silence, and highlights." },
  { icon: Scissors, label: "Edit with intent", detail: "Trim, reframe, caption, and clean audio." },
  { icon: Download, label: "Export MP4", detail: "H.264, fast-start, ready for every channel." },
];

const capabilities = [
  "Automatic transcription",
  "Scene and highlight detection",
  "Silence and filler suggestions",
  "Editable styled captions",
  "TikTok, Instagram, and YouTube formats",
  "Realtime background processing",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[760px]" />
      <nav className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/login?mode=signup">
              Start creating <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-32 lg:pt-28">
        <div className="max-w-3xl">
          <Badge variant="outline" className="mb-6 border-primary/25 bg-primary/5 px-3 py-1.5 text-primary">
            <Sparkles className="mr-1 size-3.5" /> AI video editor, now available
          </Badge>
          <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Your footage,
            <span className="block text-primary">cut to the good part.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-balance text-lg leading-8 text-muted-foreground sm:text-xl">
            SceneForge understands long videos, finds the moments worth keeping, and gives you a
            precise editor to turn them into captioned, platform-ready content.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="h-12 px-6 shadow-xl shadow-primary/10">
              <Link href="/login?mode=signup">
                Edit your first video <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 border-white/10 bg-white/[0.02] px-6">
              <Link href="#workflow">See how it works</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> Private by default</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="size-3.5 text-primary" /> Durable processing</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5 text-primary" /> Live progress</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-primary/[0.06] blur-3xl" />
          <Card className="overflow-hidden border-white/10 bg-card/90 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex h-11 items-center gap-2 border-b border-white/[0.06] px-4">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-xs text-muted-foreground">campaign-interview.mp4</span>
            </div>
            <CardContent className="p-4 sm:p-5">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-[radial-gradient(circle_at_50%_40%,oklch(0.34_0.07_240),oklch(0.13_0.015_265)_68%)]">
                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid size-14 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur">
                    <Film className="size-6 text-white/80" />
                  </span>
                </div>
                <div className="absolute inset-x-8 bottom-5 rounded-md bg-black/65 px-3 py-2 text-center text-sm font-semibold shadow-lg">
                  Turn one recording into a week of content.
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">AI analysis complete</span>
                  <span className="font-mono text-primary">00:08:42</span>
                </div>
                <div className="relative h-16 overflow-hidden rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2">
                  <div className="absolute inset-x-3 top-2 flex h-7 gap-1">
                    {[22, 14, 28, 18, 30, 13, 25, 16, 27, 19, 31, 15, 22, 12, 29, 17].map((height, index) => (
                      <span key={index} className="mt-auto w-full rounded-full bg-primary/45" style={{ height }} />
                    ))}
                  </div>
                  <div className="absolute inset-x-3 bottom-2 flex gap-1">
                    <span className="h-2 w-[24%] rounded-full bg-primary" />
                    <span className="h-2 w-[14%] rounded-full bg-amber-300/80" />
                    <span className="h-2 w-[31%] rounded-full bg-sky-400/70" />
                    <span className="h-2 flex-1 rounded-full bg-primary/70" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white/[0.035] p-3"><strong className="block text-base text-foreground">18</strong><span className="text-muted-foreground">Scenes</span></div>
                  <div className="rounded-lg bg-white/[0.035] p-3"><strong className="block text-base text-foreground">6</strong><span className="text-muted-foreground">Highlights</span></div>
                  <div className="rounded-lg bg-white/[0.035] p-3"><strong className="block text-base text-foreground">32s</strong><span className="text-muted-foreground">Silence</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="workflow" className="border-y border-white/[0.06] bg-black/10">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-sm font-medium text-primary">One clear workflow</p>
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Heavy processing stays out of your way.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Upload once. A dedicated worker handles media analysis and encoding while the editor
              stays fast and reports every step in realtime.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((step, index) => (
              <div key={step.label} className="bg-background p-6 lg:p-7">
                <div className="mb-8 flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><step.icon className="size-4.5" /></span>
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="font-medium">{step.label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-32">
        <div>
          <Badge variant="secondary" className="mb-5">Built for real edits</Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Assistance where it helps. Control where it matters.
          </h2>
          <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
            AI proposes the structure; you decide what ships. Every cut, caption style, crop, and
            audio choice remains visible and editable before export.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {capabilities.map((capability) => (
              <div key={capability} className="flex items-center gap-2.5 text-sm">
                <span className="grid size-5 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-3" /></span>
                {capability}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Captions, label: "Captions", value: "Word-timed" },
            { icon: Ratio, label: "Formats", value: "9:16 · 1:1 · 16:9" },
            { icon: Scissors, label: "Clean-up", value: "Silence + fillers" },
            { icon: Sparkles, label: "Highlights", value: "Ranked moments" },
          ].map((item) => (
            <Card key={item.label} className="border-white/[0.07] bg-card/70">
              <CardContent className="p-5 sm:p-6">
                <item.icon className="mb-8 size-5 text-primary" />
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-medium sm:text-base">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-primary/15 bg-primary/[0.055] px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="surface-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Make the first cut in minutes.</h2>
            <p className="mx-auto mt-4 max-w-xl text-balance leading-7 text-muted-foreground">Upload your footage and let SceneForge prepare an editable, captioned starting point.</p>
            <Button size="lg" asChild className="mt-8 h-12 px-6">
              <Link href="/login?mode=signup">Start your first project <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
        <Separator className="mb-8" />
        <div className="flex flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <p>AI video editing, built on a private and durable media pipeline.</p>
        </div>
      </footer>
    </main>
  );
}
