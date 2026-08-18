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
  ImagePlay,
  Megaphone,
  Plus,
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
import aiAdCreativeVisual from "@/assets/media/generated/ai-ad-creative.webp";
import aiClipperVisual from "@/assets/media/ai-clipper.webp";
import automotiveCampaign from "@/assets/showcase/automotive-campaign.jpg";
import brandPortrait from "@/assets/showcase/brand-portrait.jpg";
import creativeWorkspace from "@/assets/showcase/creative-workspace.jpg";
import digitalFalcon from "@/assets/showcase/digital-falcon.jpg";
import fantasyWorld from "@/assets/showcase/fantasy-world.jpg";
import fashionEditorial from "@/assets/showcase/fashion-editorial.jpg";
import foodCampaign from "@/assets/showcase/food-campaign.jpg";
import productPhotography from "@/assets/showcase/product-photography.jpg";
import { MarketingFooter } from "@/components/marketing-footer";
import { PricingPreview } from "@/components/pricing-preview";
import { FeatureReveal } from "@/components/feature-reveal";
import { searchIntentPages } from "@/lib/marketing/seo-pages";
import { blogPosts, formatBlogDate } from "@/lib/blog";
import { getSiteUrl, siteDescription } from "@/lib/site";

const workflow = [
  { icon: Upload, label: "Resumable upload", detail: "Large files continue where they left off." },
  { icon: WandSparkles, label: "AI-assisted analysis", detail: "Scenes, speech, silence, and highlights." },
  { icon: Scissors, label: "Shape the clip", detail: "Select, trim, reframe, caption, and clean audio." },
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

const showcaseImages = [
  { src: digitalFalcon, label: "Digital art", alt: "A futuristic blue falcon dissolving into luminous digital particles" },
  { src: brandPortrait, label: "Brand portrait", alt: "A stylized gold portrait wearing an ornate red and gold jacket" },
  { src: creativeWorkspace, label: "Creator workflow", alt: "A creator working with floating video editing and social analytics screens" },
  { src: foodCampaign, label: "Food campaign", alt: "A cinematic burger advertisement with ingredients and fries suspended in motion" },
  { src: fashionEditorial, label: "Fashion editorial", alt: "A fashion model in a metallic jacket standing on a neon-lit city street" },
  { src: fantasyWorld, label: "World building", alt: "A cinematic floating city with waterfalls, aircraft, and dramatic clouds" },
  { src: productPhotography, label: "Product photography", alt: "A luxury amber perfume bottle photographed with mist and dramatic lighting" },
  { src: automotiveCampaign, label: "Automotive campaign", alt: "A black sports car driving along a coastal road at sunset" },
] as const;

const aiImageCardVisuals = [
  { src: brandPortrait, label: "Portrait", alt: "A stylized gold portrait wearing an ornate red and gold jacket" },
  { src: fashionEditorial, label: "Fashion", alt: "A fashion model in a metallic jacket standing on a neon-lit city street" },
  { src: fantasyWorld, label: "World", alt: "A cinematic floating city with waterfalls, aircraft, and dramatic clouds" },
  { src: automotiveCampaign, label: "Campaign", alt: "A black sports car driving along a coastal road at sunset" },
] as const;

const heroBackgroundImages = [
  { src: digitalFalcon, className: "hero-media--falcon" },
  { src: brandPortrait, className: "hero-media--portrait" },
  { src: creativeWorkspace, className: "hero-media--workspace" },
  { src: foodCampaign, className: "hero-media--food" },
  { src: fashionEditorial, className: "hero-media--fashion" },
  { src: fantasyWorld, className: "hero-media--world" },
  { src: productPhotography, className: "hero-media--product" },
  { src: automotiveCampaign, className: "hero-media--automotive" },
] as const;

const siteUrl = getSiteUrl().toString();
const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: "Editing App",
      alternateName: ["EditingApp", "editingapp.live"],
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: new URL("/apple-icon.png", siteUrl).toString(),
        contentUrl: new URL("/apple-icon.png", siteUrl).toString(),
        width: 180,
        height: 180,
      },
    },
    { "@type": "WebSite", "@id": `${siteUrl}#website`, name: "Editing App", alternateName: ["EditingApp", "editingapp.live"], url: siteUrl, description: siteDescription, publisher: { "@id": `${siteUrl}#organization` }, inLanguage: "en" },
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
      <section className="relative mx-auto flex max-w-7xl flex-col items-center overflow-hidden px-5 pb-24 pt-20 text-center sm:px-8 sm:pt-24 lg:pb-32 lg:pt-32">
        <div className="hero-media-stage" aria-hidden="true">
          {heroBackgroundImages.map((visual) => (
            <div key={visual.className} className={cn("hero-media-card hero-media-image", visual.className)}>
              <Image
                src={visual.src}
                alt=""
                fill
                placeholder="blur"
                sizes="(max-width: 639px) 112px, (max-width: 1023px) 152px, 208px"
                className="object-cover"
              />
            </div>
          ))}

          <div className="hero-media-card hero-media-phone hero-media--video-falcon">
            <div className="relative size-full overflow-hidden rounded-[inherit]">
              <Image src={digitalFalcon} alt="" fill placeholder="blur" sizes="(max-width: 639px) 76px, 104px" className="object-cover" />
              <video autoPlay loop muted playsInline preload="metadata" poster={digitalFalcon.src} className="relative z-[1] size-full object-cover motion-reduce:hidden">
                <source src="/media/previews/image-to-video-falcon.mp4" type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
              </video>
            </div>
            <span className="hero-media-phone-notch" />
          </div>

          <div className="hero-media-card hero-media-phone hero-media--video-studio">
            <div className="relative size-full overflow-hidden rounded-[inherit]">
              <Image src={aiVideoVisual} alt="" fill placeholder="blur" sizes="(max-width: 639px) 76px, 104px" className="object-cover" />
              <video autoPlay loop muted playsInline preload="metadata" poster={aiVideoVisual.src} className="relative z-[1] size-full object-cover motion-reduce:hidden">
                <source src="/media/previews/ai-video-generator-showcase.mp4" type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
              </video>
            </div>
            <span className="hero-media-phone-notch" />
          </div>

          <div className="hero-media-scrim" />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[28rem] w-[min(92vw,64rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="relative z-10 max-w-5xl">
          <Badge variant="outline" className="mb-7 border-primary/25 bg-primary/5 px-3 py-1.5 italic text-primary">
            <Sparkles className="mr-1 size-3.5" /> AI Clipper + multi-model creative studio
          </Badge>
          <h1 className="text-balance text-5xl font-semibold italic leading-[0.96] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
            Create once.
            <span className="block text-primary">Captivate everywhere.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-balance text-lg italic leading-8 text-muted-foreground sm:text-xl">
            Clip the moments people remember, turn still images into motion, generate premium video and visuals,
            and launch ready-to-run ads from one private creative workspace.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="h-12 px-6 shadow-xl shadow-primary/10">
              <Link href="/features">
                Explore all features <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 border-border bg-card/55 px-6">
              <Link href="/generate/video">Explore the studio</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs italic text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> Private by default</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="size-3.5 text-primary" /> Durable processing</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5 text-primary" /> Live progress</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Available premium AI model families">
            {['Seedance 2.5', 'LTX 2.3', 'Veo 3.1', 'Kling 3', 'Seedream 5'].map((model) => <Link href="/ai-video-models" key={model} className="rounded-full border border-border bg-card/65 px-3 py-1.5 text-[10px] font-medium italic text-muted-foreground shadow-sm transition hover:border-primary/25 hover:text-primary">{model}</Link>)}
          </div>
        </div>
      </section>

      <section className="showcase-section relative border-y border-border bg-card/35 py-16 sm:py-20" aria-labelledby="creative-showcase-title">
        <div className="mx-auto mb-9 flex max-w-7xl flex-col gap-5 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium text-primary">Creative examples</p>
            <h2 id="creative-showcase-title" className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Explore what your next idea could look like.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              From product campaigns and fashion concepts to cinematic worlds, shape a clear brief and choose the visual direction that fits it.
            </p>
          </div>
          <label className="w-fit cursor-pointer select-none">
            <input type="checkbox" className="showcase-pause peer sr-only" aria-label="Pause or resume the automatic creative showcase" />
            <span className="inline-flex rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition hover:border-primary/25 hover:text-foreground peer-checked:hidden peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
              Pause motion
            </span>
            <span className="hidden rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary shadow-sm peer-checked:inline-flex peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
              Resume motion
            </span>
          </label>
        </div>

        <div className="showcase-viewport overflow-hidden" aria-label="AI-generated creative examples">
          <div className="showcase-track flex w-max gap-4 py-2">
            {[...showcaseImages, ...showcaseImages].map((visual, index) => {
              const duplicate = index >= showcaseImages.length;
              return (
                <figure
                  key={`${visual.label}-${index}`}
                  aria-hidden={duplicate || undefined}
                  className={cn(
                    "group relative w-[86vw] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-muted shadow-xl shadow-black/10 sm:w-[58vw] lg:w-[42vw] xl:w-[34rem]",
                    duplicate && "showcase-duplicate",
                  )}
                >
                  <div className="relative aspect-[25/12] overflow-hidden">
                    <Image
                      src={visual.src}
                      alt={duplicate ? "" : visual.alt}
                      placeholder="blur"
                      sizes="(max-width: 640px) 86vw, (max-width: 1024px) 58vw, (max-width: 1280px) 42vw, 34rem"
                      className="object-cover transition duration-700 group-hover:scale-[1.025]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/10" />
                  </div>
                  <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 text-white sm:p-5">
                    <span className="text-sm font-medium sm:text-base">{visual.label}</span>
                    <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-white/75 backdrop-blur sm:text-[10px]">AI-generated example</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-y border-border bg-foreground/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-medium text-primary">The Editing App creative suite</p>
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Features that take every idea from brief to finished creative.
              </h2>
            </div>
            <div className="max-w-md"><p className="text-sm leading-6 text-muted-foreground">Each tool is purpose-built, but projects, private storage, background jobs, and model routing live in one workspace.</p><Link href={"/features" as Route} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Explore all AI features <ArrowRight className="size-3.5" /></Link></div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureReveal>
            <Link href="/clipper" aria-label="Open AI Clipper" className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="group h-full overflow-hidden border-primary/15 bg-card/65 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
              <CardContent className="p-0">
                <div data-feature-media className="relative h-52 overflow-hidden border-b border-border bg-muted p-5">
                  <Image src={aiClipperVisual} alt="AI Clipper reviewing ranked moments from a long-form video" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
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
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">AI Clipper</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Paste a supported video link or upload footage, find high-retention moments, select a clip, add captions, and export for Shorts, Reels, or TikTok.</p>
                </div>
              </CardContent>
            </Card>
            </Link>
            </FeatureReveal>

            <FeatureReveal>
            <Link href="/generate/video" aria-label="Open AI video generator" className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="group h-full overflow-hidden border-border bg-card/65 transition hover:-translate-y-1 hover:border-sky-400/25 hover:shadow-lg">
              <CardContent className="p-0">
                <div data-feature-media className="relative h-52 overflow-hidden border-b border-border bg-muted">
                  <Image src={aiVideoVisual} alt="A cinematic concept car moving through a rain-lit city" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                  <video aria-label="AI-generated cinematic video example" autoPlay loop muted playsInline preload="metadata" poster={aiVideoVisual.src} className="absolute inset-0 size-full object-cover motion-reduce:hidden">
                    <source src="/media/previews/ai-video-generator-showcase.mp4" type="video/mp4" />
                  </video>
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
                </div>
              </CardContent>
            </Card>
            </Link>
            </FeatureReveal>

            <FeatureReveal>
            <Link href="/generate/image" aria-label="Open AI image generator" className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="group h-full overflow-hidden border-border bg-card/65 transition hover:-translate-y-1 hover:border-fuchsia-300/25 hover:shadow-lg">
              <CardContent className="p-0">
                <div data-feature-media className="relative h-52 overflow-hidden border-b border-border bg-muted">
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-white/25">
                    {aiImageCardVisuals.map((visual) => (
                      <div key={visual.label} className="relative overflow-hidden bg-muted">
                        <Image
                          src={visual.src}
                          alt={visual.alt}
                          fill
                          placeholder="blur"
                          sizes="(max-width: 767px) 50vw, (max-width: 1023px) 25vw, 17vw"
                          className="object-cover transition duration-700 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />
                        <span className="absolute bottom-2 left-2 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[8px] uppercase tracking-[0.12em] text-white/80 backdrop-blur">
                          {visual.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div data-feature-copy className="p-6">
                  <div className="mb-5 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-fuchsia-500/10 text-fuchsia-700"><ImageIcon className="size-4.5" /></span><Badge variant="outline" className="border-fuchsia-700/20 bg-fuchsia-500/5 text-fuchsia-700">New</Badge></div>
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">AI image generator</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Work from a creative brief, not a mystery prompt box. Shape art direction, canvas, seed, and model intent for repeatable campaign-grade visuals.</p>
                </div>
              </CardContent>
            </Card>
            </Link>
            </FeatureReveal>

            <FeatureReveal>
            <Link href="/generate/image-to-video" aria-label="Open AI image to video generator" className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="group h-full overflow-hidden border-border bg-card/65 transition hover:-translate-y-1 hover:border-violet-400/25 hover:shadow-lg">
              <CardContent className="p-0">
                <div data-feature-media className="relative h-52 overflow-hidden border-b border-border bg-muted">
                  <div className="absolute inset-0 grid grid-cols-2">
                    <div className="relative overflow-hidden border-r border-white/20">
                      <Image src={digitalFalcon} alt="A futuristic falcon used as the source frame for AI image-to-video generation" fill placeholder="blur" sizes="(max-width: 1024px) 50vw, 17vw" className="object-cover object-center transition duration-700 group-hover:scale-[1.03]" />
                    </div>
                    <div className="relative overflow-hidden bg-black">
                      <Image src={digitalFalcon} alt="" fill placeholder="blur" sizes="(max-width: 1024px) 50vw, 17vw" className="object-cover object-center" />
                      <video aria-label="The source falcon animated into an AI-generated video" autoPlay loop muted playsInline preload="metadata" poster={digitalFalcon.src} className="absolute inset-0 size-full object-cover motion-reduce:hidden">
                        <source src="/media/previews/image-to-video-falcon.mp4" type="video/mp4" />
                      </video>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/10" />
                  <div className="absolute inset-x-4 bottom-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[9px] text-white/85 sm:text-[10px]"><span className="rounded-full border border-white/15 bg-black/45 px-2 py-1.5 text-center backdrop-blur">SOURCE IMAGE</span><ArrowRight className="size-4 text-violet-200" /><span className="rounded-full border border-violet-300/25 bg-violet-300/15 px-2 py-1.5 text-center backdrop-blur">AI VIDEO</span></div>
                </div>
                <div data-feature-copy className="p-6">
                  <div className="mb-5 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-700"><ImagePlay className="size-4.5" /></span><Badge variant="outline" className="border-violet-700/20 bg-violet-500/5 text-violet-700">New</Badge></div>
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">AI image to video generator</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Animate a photo, product, or artwork with identity lock, optional end-frame transitions, camera direction, native audio, and compatible premium models.</p>
                </div>
              </CardContent>
            </Card>
            </Link>
            </FeatureReveal>

            <FeatureReveal>
            <Link href="/remove-background" aria-label="Open AI background remover" className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="group h-full overflow-hidden border-border bg-card/65 transition hover:-translate-y-1 hover:border-amber-300/25 hover:shadow-lg">
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
                </div>
              </CardContent>
            </Card>
            </Link>
            </FeatureReveal>

            <FeatureReveal>
            <Link href="/creative-studio/image" aria-label="Open AI image ad creator" className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="group h-full overflow-hidden border-primary/15 bg-card/65 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
              <CardContent className="p-0">
                <div data-feature-media className="relative h-52 overflow-hidden border-b border-border bg-muted">
                  <Image src={aiAdCreativeVisual} alt="A polished social image advertisement for a premium product" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/15" />
                  <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2 text-[9px] text-white/80">
                    <span className="rounded-lg border border-white/15 bg-black/45 px-2 py-2 text-center backdrop-blur">OFFER</span>
                    <span className="rounded-lg border border-primary/30 bg-primary/20 px-2 py-2 text-center backdrop-blur">VISUAL</span>
                    <span className="rounded-lg border border-white/15 bg-black/45 px-2 py-2 text-center backdrop-blur">CTA</span>
                  </div>
                  <div className="absolute left-4 top-4 rounded-full border border-primary/25 bg-black/45 px-3 py-1.5 text-[10px] text-primary backdrop-blur">ONLINE + LOCAL BUSINESS</div>
                </div>
                <div data-feature-copy className="p-6">
                  <div className="mb-5 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><ImageIcon className="size-4.5" /></span><Badge className="bg-primary/15 text-primary">Separate studio</Badge></div>
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">AI image ad creator</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Turn a product URL or real local-business brief into source-aware image ads sized for Facebook, Instagram, TikTok, and YouTube.</p>
                </div>
              </CardContent>
            </Card>
            </Link>
            </FeatureReveal>

            <FeatureReveal>
            <Link href="/creative-studio/video" aria-label="Open AI video ad creator" className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="group h-full overflow-hidden border-primary/15 bg-card/65 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
              <CardContent className="p-0">
                <div data-feature-media className="relative h-52 overflow-hidden border-b border-border bg-muted">
                  <Image src={aiAdCreativeVisual} alt="A platform-ready ecommerce video advertisement storyboard" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                  <video aria-hidden="true" autoPlay loop muted playsInline preload="metadata" poster={aiAdCreativeVisual.src} className="absolute inset-0 hidden size-full object-cover md:block motion-reduce:hidden"><source src="/media/previews/ai-ad-creative-generator.mp4" type="video/mp4" media="(min-width: 768px) and (prefers-reduced-motion: no-preference)" /></video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/15" />
                  <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2 text-[9px] text-white/80"><span className="rounded-lg border border-white/15 bg-black/45 px-3 py-2 backdrop-blur">PRODUCT URL</span><span className="rounded-lg border border-primary/30 bg-primary/20 px-3 py-2 backdrop-blur">MOTION AD</span><span className="rounded-lg border border-white/15 bg-black/45 px-3 py-2 backdrop-blur">NATIVE AUDIO</span></div>
                  <div className="absolute left-4 top-4 rounded-full border border-primary/25 bg-black/45 px-3 py-1.5 text-[10px] text-primary backdrop-blur">SOCIAL VIDEO PERFORMANCE</div>
                </div>
                <div data-feature-copy className="p-6">
                  <div className="mb-5 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Megaphone className="size-4.5" /></span><Badge className="bg-primary/15 text-primary">Separate studio</Badge></div>
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">AI video ad creator</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Turn a product URL or analyzed long video into source-aware motion ads with platform pacing, premium models, and private delivery.</p>
                </div>
              </CardContent>
            </Card>
            </Link>
            </FeatureReveal>

            <FeatureReveal>
              <Card className="flex h-full min-h-[22rem] items-center justify-center border-dashed border-primary/25 bg-primary/[0.025] shadow-none">
                <CardContent data-feature-copy className="flex max-w-xs flex-col items-center px-8 py-12 text-center">
                  <span className="grid size-16 place-items-center rounded-full border border-dashed border-primary/35 bg-primary/5 text-primary">
                    <Plus className="size-7" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.025em]">More tools coming</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    New creative workflows will appear here.
                  </p>
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
              Add a link or upload once. A dedicated worker handles media analysis and encoding while AI Clipper
              stays responsive and reports every step in realtime.
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
          <Badge variant="secondary" className="mb-5">Built for precise clips</Badge>
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
          <div className="max-w-3xl"><p className="text-sm font-medium text-primary">Focused creative workflows</p><h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Start with the outcome, then choose the model.</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Build a product ad from a real page or turn one long recording into channel-ready clips. Every workflow stays connected to AI Clipper and private project storage.</p></div>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {searchIntentPages.map((page) => <Card key={page.slug} className="border-border bg-card/60"><CardContent className="p-6 sm:p-8"><p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">{page.eyebrow}</p><h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{page.title}</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">{page.description}</p><Link href={`/tools/${page.slug}` as Route} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Explore the workflow <ArrowRight className="size-3.5" /></Link></CardContent></Card>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="latest-creative-guides">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl"><p className="text-sm font-medium text-primary">From the field guide</p><h2 id="latest-creative-guides" className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Make better creative decisions before spending a credit.</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Human-reviewed guides for cleaner product images, stronger short-form edits, and more controllable AI generations.</p></div>
          <Link href={"/blog" as Route} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary">View all guides <ArrowRight className="size-3.5" /></Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {blogPosts.slice(0, 3).map((post) => (
            <article key={post.slug}>
              <Link href={`/blog/${post.slug}` as Route} className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="h-full overflow-hidden border-border bg-card/60 transition group-hover:-translate-y-1 group-hover:border-primary/25 group-hover:shadow-lg">
                  <div className="relative aspect-video overflow-hidden bg-muted"><Image src={post.cover} alt={post.coverAlt} fill placeholder="blur" sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.025]" /><div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" /><Badge className="absolute bottom-3 left-3 border-white/15 bg-black/45 text-white backdrop-blur">{post.category}</Badge></div>
                  <CardContent className="p-5 sm:p-6"><p className="text-xs text-muted-foreground"><time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time><span className="mx-2">·</span>{post.readingTime}</p><h3 className="mt-3 text-xl font-semibold tracking-[-0.025em] group-hover:text-primary">{post.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p><span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Read guide <ArrowRight className="size-3.5" /></span></CardContent>
                </Card>
              </Link>
            </article>
          ))}
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
