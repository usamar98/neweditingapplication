import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import {
  ArrowRight,
  Captions,
  Check,
  Clapperboard,
  Clock3,
  Download,
  Film,
  ImageIcon,
  Megaphone,
  Ratio,
  Scissors,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import aiImageVisual from "@/assets/media/ai-image.webp";
import aiVideoVisual from "@/assets/media/ai-video.webp";
import videoEditorVisual from "@/assets/media/video-editor.webp";
import { MarketingFooter } from "@/components/marketing-footer";
import { PricingPreview } from "@/components/pricing-preview";
import { FeatureReveal } from "@/components/feature-reveal";
import { WelcomeCreditsCard } from "@/components/welcome-credits-card";
import { searchIntentPages } from "@/lib/marketing/seo-pages";
import { getSiteUrl, siteDescription } from "@/lib/site";

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

const siteUrl = getSiteUrl().toString();
const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${siteUrl}#organization`, name: "Editing App", url: siteUrl, logo: new URL("/icon.svg", siteUrl).toString() },
    { "@type": "WebSite", "@id": `${siteUrl}#website`, name: "Editing App", url: siteUrl, description: siteDescription, publisher: { "@id": `${siteUrl}#organization` }, inLanguage: "en" },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}#software`,
      name: "Editing App",
      url: siteUrl,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      description: siteDescription,
      offers: [
        { "@type": "Offer", name: "Creator", price: "29.99", priceCurrency: "USD" },
        { "@type": "Offer", name: "Studio", price: "49.99", priceCurrency: "USD" },
        { "@type": "Offer", name: "Business", price: "99.99", priceCurrency: "USD" },
      ],
    },
  ],
};

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd).replace(/</g, "\\u003c") }} />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[760px]" />
      <section className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-32 lg:pt-28">
        <div className="max-w-3xl">
          <Badge variant="outline" className="mb-6 border-primary/25 bg-primary/5 px-3 py-1.5 text-primary">
            <Sparkles className="mr-1 size-3.5" /> AI video editor + multi-model creative studio
          </Badge>
          <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Edit. Generate.
            <span className="block text-primary">Launch creative that performs.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-balance text-lg leading-8 text-muted-foreground sm:text-xl">
            Edit long footage, generate premium video and images, and turn product pages into ready-to-run ads.
            Choose Seedance, LTX, Veo, Kling, Seedream, and more—or let Model Autopilot route the brief.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="h-12 px-6 shadow-xl shadow-primary/10">
              <Link href="/generate/image?claim=welcome">
                Start creating free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 border-border bg-card/55 px-6">
              <Link href="/features/ai-video-generator">Explore the studio</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> Private by default</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="size-3.5 text-primary" /> Durable processing</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5 text-primary" /> Live progress</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2" aria-label="Available premium AI model families">
            {['Seedance 2.5', 'LTX 2.3', 'Veo 3.1', 'Kling 3', 'Seedream 5'].map((model) => <Link href="/ai-video-models" key={model} className="rounded-full border border-border bg-card/65 px-3 py-1.5 text-[10px] font-medium text-muted-foreground shadow-sm transition hover:border-primary/25 hover:text-primary">{model}</Link>)}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-primary/[0.06] blur-3xl" />
          <Card className="overflow-hidden border-border bg-card/90 shadow-2xl shadow-black/10 backdrop-blur">
            <div className="flex h-11 items-center gap-2 border-b border-border px-4">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-xs text-muted-foreground">Editing App · creative command center</span>
            </div>
            <CardContent className="p-4 sm:p-5">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                <Image
                  src={videoEditorVisual}
                  alt="A professional editor refining an interview in a post-production studio"
                  fill
                  placeholder="blur"
                  sizes="(max-width: 1024px) 92vw, 44vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/10" />
                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid size-14 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur">
                    <Film className="size-6 text-white/80" />
                  </span>
                </div>
                <div className="absolute inset-x-8 bottom-5 rounded-md bg-black/65 px-3 py-2 text-center text-sm font-semibold shadow-lg">
                  Turn one recording into a week of content.
                </div>
                <div className="absolute left-4 top-4 rounded-lg border border-primary/25 bg-black/60 px-3 py-2 text-[10px] text-primary backdrop-blur">GPT-5 mini Editor · selected</div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">AI analysis complete</span>
                  <span className="font-mono text-primary">00:08:42</span>
                </div>
                <div className="relative h-16 overflow-hidden rounded-lg border border-border bg-muted/70 px-3 py-2">
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
                  <div className="rounded-lg bg-muted/70 p-3"><strong className="block text-base text-foreground">18</strong><span className="text-muted-foreground">Scenes</span></div>
                  <div className="rounded-lg bg-muted/70 p-3"><strong className="block text-base text-foreground">6</strong><span className="text-muted-foreground">Highlights</span></div>
                  <div className="rounded-lg bg-muted/70 p-3"><strong className="block text-base text-foreground">32s</strong><span className="text-muted-foreground">Silence</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-24">
        <WelcomeCreditsCard credits={null} isAuthenticated={false} />
      </section>

      <section id="features" className="scroll-mt-20 border-y border-border bg-foreground/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-medium text-primary">The Editing App creative suite</p>
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                One idea. Five ways to make it perform.
              </h2>
            </div>
            <div className="max-w-md"><p className="text-sm leading-6 text-muted-foreground">Each tool is purpose-built, but projects, private storage, background jobs, and model routing live in one workspace.</p><Link href={"/features" as Route} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Explore all AI features <ArrowRight className="size-3.5" /></Link></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <FeatureReveal>
            <Card className="group h-full overflow-hidden border-primary/15 bg-card/65 transition hover:-translate-y-1 hover:border-primary/30">
              <CardContent className="p-0">
                <div data-feature-media className="relative h-52 overflow-hidden border-b border-border bg-muted p-5">
                  <Image src={videoEditorVisual} alt="A film editor working in a professional post-production suite" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10" />
                  <div className="absolute inset-x-5 bottom-5 rounded-xl border border-white/10 bg-black/35 p-3 backdrop-blur">
                    <div className="mb-3 flex items-center justify-between text-[10px] text-white/60"><span>campaign-interview.mp4</span><span className="text-primary">6 highlights found</span></div>
                    <div className="flex h-10 items-end gap-1">
                      {[48, 76, 40, 82, 54, 90, 34, 68, 44, 84, 58, 72].map((height, index) => <span key={index} className="w-full rounded-full bg-primary/50" style={{ height: `${height}%` }} />)}
                    </div>
                  </div>
                </div>
                <div data-feature-copy className="p-6">
                  <div className="mb-5 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Scissors className="size-4.5" /></span><Badge variant="secondary">Available now</Badge></div>
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">AI video editor</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Upload long footage and get scenes, transcript, silence cleanup, highlights, captions, reframing, and a precise editable timeline.</p>
                  <Link href="/features/ai-video-editor" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Explore AI video editing <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></Link>
                </div>
              </CardContent>
            </Card>
            </FeatureReveal>

            <FeatureReveal>
            <Card className="group h-full overflow-hidden border-border bg-card/65 transition hover:-translate-y-1 hover:border-sky-400/25">
              <CardContent className="p-0">
                <div data-feature-media className="relative h-52 overflow-hidden border-b border-border bg-muted">
                  <Image src={aiVideoVisual} alt="A cinematic concept car moving through a rain-lit city" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/15" />
                  <div className="absolute left-5 top-5 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-[10px] text-sky-200">MODEL AUTOPILOT</div>
                  <div className="absolute inset-x-5 bottom-5 grid grid-cols-3 gap-2">
                    {["Quality", "Speed", "Cost"].map((label, index) => <div key={label} className={cn("rounded-lg border border-white/10 bg-black/30 p-3 text-center text-[10px] text-white/55 backdrop-blur", index === 0 && "border-sky-300/35 bg-sky-300/10 text-sky-100")}>{label}</div>)}
                  </div>
                  <Clapperboard className="absolute right-7 top-8 size-14 text-white/15" />
                </div>
                <div data-feature-copy className="p-6">
                  <div className="mb-5 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-sky-500/10 text-sky-700"><Film className="size-4.5" /></span><Badge variant="outline" className="border-sky-700/20 bg-sky-500/5 text-sky-700">New</Badge></div>
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">AI video generator</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Direct camera motion, mood, format, duration, resolution, and native audio. Autopilot selects the strongest compatible video model for the job.</p>
                  <Link href="/features/ai-video-generator" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700">Explore video generation <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></Link>
                </div>
              </CardContent>
            </Card>
            </FeatureReveal>

            <FeatureReveal>
            <Card className="group h-full overflow-hidden border-border bg-card/65 transition hover:-translate-y-1 hover:border-fuchsia-300/25">
              <CardContent className="p-0">
                <div data-feature-media className="relative h-52 overflow-hidden border-b border-border bg-muted">
                  <Image src={aiImageVisual} alt="A premium smoky-glass perfume bottle in a cinematic product photograph" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
                </div>
                <div data-feature-copy className="p-6">
                  <div className="mb-5 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-fuchsia-500/10 text-fuchsia-700"><ImageIcon className="size-4.5" /></span><Badge variant="outline" className="border-fuchsia-700/20 bg-fuchsia-500/5 text-fuchsia-700">New</Badge></div>
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">AI image generator</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Work from a creative brief, not a mystery prompt box. Shape art direction, canvas, seed, and model intent for repeatable campaign-grade visuals.</p>
                  <Link href="/features/ai-image-generator" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-fuchsia-700">Explore image generation <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></Link>
                </div>
              </CardContent>
            </Card>
            </FeatureReveal>

            <FeatureReveal>
            <Card className="group h-full overflow-hidden border-border bg-card/65 transition hover:-translate-y-1 hover:border-amber-300/25">
              <CardContent className="p-0">
                <div data-feature-media className="relative h-52 overflow-hidden border-b border-border bg-[linear-gradient(45deg,oklch(0.86_0.01_88)_25%,transparent_25%),linear-gradient(-45deg,oklch(0.86_0.01_88)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,oklch(0.86_0.01_88)_75%),linear-gradient(-45deg,transparent_75%,oklch(0.86_0.01_88)_75%)] bg-[length:22px_22px]">
                  <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden border-r border-white/25"><Image src={aiImageVisual} alt="A product photograph ready for background removal" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div>
                  <div className="absolute inset-y-0 right-0 w-1/2"><Image src={aiImageVisual} alt="" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain mix-blend-lighten" /></div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] text-white/80 backdrop-blur">BEFORE / TRANSPARENT</div>
                </div>
                <div data-feature-copy className="p-6">
                  <div className="mb-5 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-700"><Scissors className="size-4.5" /></span><Badge variant="outline" className="border-amber-700/20 bg-amber-500/5 text-amber-700">New</Badge></div>
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">Background remover</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Protect fine hair, product edges, and soft foreground detail with precision matting, private inputs, and downloadable transparent PNG results.</p>
                  <Link href="/features/background-remover" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">Explore background removal <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></Link>
                </div>
              </CardContent>
            </Card>
            </FeatureReveal>

            <FeatureReveal className="lg:col-span-2">
            <Card className="group h-full overflow-hidden border-primary/15 bg-card/65 transition hover:-translate-y-1 hover:border-primary/30">
              <CardContent className="grid p-0 lg:grid-cols-[0.95fr_1.05fr]">
                <div data-feature-media className="relative min-h-64 overflow-hidden border-b border-border bg-muted lg:border-b-0 lg:border-r">
                  <Image src={aiVideoVisual} alt="A campaign video prepared for performance marketing platforms" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-black/30 to-black/80" />
                  <div className="absolute inset-x-5 bottom-5 grid grid-cols-4 gap-2">
                    {["Facebook", "Instagram", "TikTok", "YouTube"].map((platform, index) => <div key={platform} className={cn("rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-center text-[9px] text-white/65 backdrop-blur", index === 1 && "border-primary/35 bg-primary/10 text-primary")}>{platform}</div>)}
                  </div>
                  <div className="absolute left-5 top-5 rounded-full border border-primary/25 bg-black/45 px-3 py-1.5 text-[10px] text-primary backdrop-blur">SOURCE-AWARE AI AGENTS</div>
                </div>
                <div data-feature-copy className="flex flex-col justify-center p-6 sm:p-8">
                  <div className="mb-5 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Megaphone className="size-4.5" /></span><Badge className="bg-primary/15 text-primary">New flagship tool</Badge></div>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">AI Ad Creative Generator</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Turn a product URL into a source-aware Seedance or Veo ad, or let Video Understanding find the strongest hook in long footage and render a captioned short for the platform you choose.</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-[10px] text-muted-foreground"><span className="rounded-full border border-border px-2.5 py-1">Seedance 2.5 Ad Director</span><span className="rounded-full border border-border px-2.5 py-1">Veo 3.1 Ad Director</span><span className="rounded-full border border-border px-2.5 py-1">Video Understanding Scout</span></div>
                  <Link href="/features/performance-creative-studio" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Explore AI ad generation <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></Link>
                </div>
              </CardContent>
            </Card>
            </FeatureReveal>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-border bg-foreground/[0.025]">
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
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
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
            <Card key={item.label} className="border-border bg-card/70">
              <CardContent className="p-5 sm:p-6">
                <item.icon className="mb-8 size-5 text-primary" />
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-medium sm:text-base">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-foreground/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-3xl"><p className="text-sm font-medium text-primary">Focused creative workflows</p><h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Start with the outcome, then choose the model.</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Build a product ad from a real page or turn one long recording into channel-ready clips. Every workflow stays connected to the editor and private project storage.</p></div>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {searchIntentPages.map((page) => <Card key={page.slug} className="border-border bg-card/60"><CardContent className="p-6 sm:p-8"><p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">{page.eyebrow}</p><h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{page.title}</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">{page.description}</p><Link href={`/tools/${page.slug}` as Route} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Explore the workflow <ArrowRight className="size-3.5" /></Link></CardContent></Card>)}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 border-y border-border bg-foreground/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-medium text-primary">Simple launch pricing</p>
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Choose your creative velocity.</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Three monthly plans with clear generation budgets, model-aware quality limits, and secure Stripe checkout.</p>
          </div>
          <PricingPreview />
          <div className="mt-8 text-center"><Link href={"/pricing" as Route} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">See full plan details and credit FAQs <ArrowRight className="size-3.5" /></Link></div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-primary/15 bg-primary/[0.055] px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="surface-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Make the first cut in minutes.</h2>
            <p className="mx-auto mt-4 max-w-xl text-balance leading-7 text-muted-foreground">Upload your footage and let Editing App prepare an editable, captioned starting point.</p>
            <Button size="lg" asChild className="mt-8 h-12 px-6">
              <Link href="/login?mode=signup">Start your first project <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
