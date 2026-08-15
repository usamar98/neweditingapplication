import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingFooter } from "@/components/marketing-footer";
import { getSiteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Video Model Guide: Seedance, Veo & Kling",
  description: "Compare current AI video models by shot length, native audio, resolution, and the job each model handles best in Editing App.",
  alternates: { canonical: "/ai-video-models" },
  openGraph: { title: "AI Video Model Guide: Seedance, Veo & Kling", description: "Compare current AI video models by shot length, native audio, resolution, and best-fit workflow.", type: "article", url: "/ai-video-models" },
  twitter: { card: "summary_large_image", title: "AI Video Model Guide: Seedance, Veo & Kling", description: "Compare current AI video models by shot length, native audio, resolution, and best-fit workflow." },
};

const models = [
  { name: "Seedance 2.5", bestFor: "Long single-shot storytelling", duration: "Up to 30 sec", resolution: "720p", audio: "Native", docs: "https://fal.ai/seedance-2.5" },
  { name: "LTX 2.3 Pro", bestFor: "Sharp premium video and 4K masters", duration: "6, 8, or 10 sec", resolution: "1080p to native 4K", audio: "Native", docs: "https://fal.ai/models/fal-ai/ltx-2.3/text-to-video/api" },
  { name: "Veo 3.1", bestFor: "Cinematic fidelity and product motion", duration: "4, 6, or 8 sec", resolution: "720p to native 4K", audio: "Native", docs: "https://fal.ai/models/fal-ai/veo3.1" },
  { name: "Kling 3 Pro", bestFor: "Realistic movement and flexible shots", duration: "3 to 15 sec", resolution: "Provider-managed HD", audio: "Native", docs: "https://fal.ai/models/fal-ai/kling-video/v3/pro/text-to-video/api" },
] as const;

export default function AiVideoModelsPage() {
  const pageUrl = new URL("/ai-video-models", getSiteUrl()).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "AI video model guide",
        description: metadata.description,
        url: pageUrl,
        dateModified: "2026-08-10",
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: siteName, url: getSiteUrl().toString() },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: models.map((model, index) => ({ "@type": "ListItem", position: index + 1, name: model.name, url: model.docs })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: getSiteUrl().toString() },
          { "@type": "ListItem", position: 2, name: "Features", item: new URL("/features", getSiteUrl()).toString() },
          { "@type": "ListItem", position: 3, name: "AI video model guide", item: pageUrl },
        ],
      },
    ],
  };
  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[580px]" />
      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 text-center sm:px-8 lg:pt-24">
        <nav aria-label="Breadcrumb" className="mb-8 text-left text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><Link href={"/features" as Route} className="hover:text-foreground">Features</Link><span className="mx-2">/</span><span>AI video model guide</span></nav>
        <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">Verified model guide · updated August 2026</Badge>
        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Choose the AI video model by the shot—not the hype.</h1>
        <p className="mx-auto mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">Editing App exposes model choice and hides impossible combinations. Longer does not always mean sharper, and 4K is useful only when the model generates it natively.</p>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="hidden grid-cols-[1fr_1.4fr_.8fr_1fr_.65fr] gap-4 border-b border-border bg-muted/70 px-5 py-4 text-xs font-medium text-muted-foreground md:grid"><span>Model</span><span>Best for</span><span>Shot length</span><span>Resolution</span><span>Audio</span></div>
          {models.map((model) => (
            <div key={model.name} className="grid gap-3 border-b border-border bg-card/60 px-5 py-5 last:border-0 md:grid-cols-[1fr_1.4fr_.8fr_1fr_.65fr] md:items-center md:gap-4">
              <a href={model.docs} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">{model.name}<ExternalLink className="size-3" /></a>
              <span className="text-sm text-muted-foreground">{model.bestFor}</span><span className="text-sm">{model.duration}</span><span className="text-sm">{model.resolution}</span><span className="inline-flex items-center gap-1.5 text-sm"><Check className="size-3.5 text-primary" />{model.audio}</span>
            </div>
          ))}
        </div>
        <Card className="mt-6 border-primary/15 bg-primary/[0.045]"><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Let Autopilot handle compatibility.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Choose quality, balance, speed, or cost. Editing App routes only among models that support the requested duration and resolution, then stores the routing reason with the result.</p></div><Button asChild className="shrink-0"><Link href="/login?mode=signup">Start a video <ArrowRight className="size-4" /></Link></Button></CardContent></Card>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-primary"><Link href="/generate/video">Open multi-model video generation <ArrowRight className="ml-1 inline size-3.5" /></Link><Link href={"/pricing" as Route}>Compare plans and credits <ArrowRight className="ml-1 inline size-3.5" /></Link><Link href={"/compare" as Route}>Compare AI video platforms <ArrowRight className="ml-1 inline size-3.5" /></Link></div>
      </section>
      <MarketingFooter />
    </main>
  );
}
