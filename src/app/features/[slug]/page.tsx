import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnswerSummary } from "@/components/answer-summary";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingCardMedia } from "@/components/marketing-card-media";
import { getMarketingFeature, marketingFeatures } from "@/lib/marketing/features";
import { searchIntentPages } from "@/lib/marketing/seo-pages";
import { getSiteUrl, siteName } from "@/lib/site";

const featureStudioPaths: Record<(typeof marketingFeatures)[number]["slug"], Route> = {
  "ai-video-editor": "/dashboard",
  "ai-video-generator": "/generate/video",
  "ai-image-generator": "/generate/image",
  "performance-creative-studio": "/creative-studio",
  "background-remover": "/remove-background",
};

export const dynamicParams = false;

export function generateStaticParams() {
  return marketingFeatures.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/features/[slug]">): Promise<Metadata> {
  const feature = getMarketingFeature((await params).slug);
  if (!feature) return {};
  const path = `/features/${feature.slug}`;
  return {
    title: feature.seoTitle,
    description: feature.description,
    keywords: [...feature.keywords],
    alternates: { canonical: path },
    openGraph: { title: feature.seoTitle, description: feature.description, type: "website", url: path },
    twitter: { card: "summary_large_image", title: feature.seoTitle, description: feature.description },
  };
}

export default async function FeaturePage({ params }: PageProps<"/features/[slug]">) {
  const feature = getMarketingFeature((await params).slug);
  if (!feature) notFound();
  const pageUrl = new URL(`/features/${feature.slug}`, getSiteUrl()).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: `${siteName} — ${feature.cardTitle}`,
        applicationCategory: "MultimediaApplication",
        applicationSubCategory: feature.cardTitle,
        operatingSystem: "Web",
        description: feature.description,
        url: pageUrl,
        dateModified: "2026-08-10",
        inLanguage: "en",
        featureList: feature.benefits,
        keywords: feature.keywords.join(", "),
        audience: { "@type": "Audience", audienceType: feature.answer.bestFor },
        offers: { "@type": "AggregateOffer", lowPrice: "29.99", highPrice: "99.99", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: getSiteUrl().toString() },
          { "@type": "ListItem", position: 2, name: "Features", item: new URL("/features", getSiteUrl()).toString() },
          { "@type": "ListItem", position: 3, name: feature.eyebrow, item: pageUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: feature.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[620px]" />
      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 text-center sm:px-8 lg:pb-24 lg:pt-24">
        <nav aria-label="Breadcrumb" className="mb-8 text-left text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><Link href={"/features" as Route} className="hover:text-foreground">Features</Link><span className="mx-2">/</span><span>{feature.eyebrow}</span></nav>
        <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary"><Sparkles className="size-3.5" /> {feature.eyebrow}</Badge>
        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{feature.title}</h1>
        <p className="mx-auto mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">{feature.description}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild><Link href={featureStudioPaths[feature.slug]}>Open the full studio <ArrowRight className="size-4" /></Link></Button>
          <Button size="lg" variant="outline" asChild><Link href={"/pricing" as Route}>Compare plans</Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/70 shadow-sm">
          <MarketingCardMedia slug={feature.slug} className="border-b-0" />
        </div>
      </section>

      <AnswerSummary
        question={feature.answer.question}
        answer={feature.answer.summary}
        facts={[
          { label: "Best for", value: feature.answer.bestFor },
          { label: "Starts with", value: feature.answer.input },
          { label: "Produces", value: feature.answer.output },
        ]}
      />

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-20 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:pb-28">
        <Card className="border-border bg-card/70"><CardContent className="p-6 sm:p-8"><h2 className="text-2xl font-semibold tracking-[-0.03em]">Built for a real production workflow</h2><div className="mt-7 grid gap-4 sm:grid-cols-2">{feature.benefits.map((benefit) => <div key={benefit} className="flex gap-3 rounded-xl border border-border bg-muted/55 p-4 text-sm leading-6 text-muted-foreground"><Check className="mt-1 size-4 shrink-0 text-primary" />{benefit}</div>)}</div></CardContent></Card>
        <Card className="border-primary/15 bg-primary/[0.045]"><CardContent className="p-6 sm:p-8"><h2 className="text-xl font-semibold">How it works</h2><ol className="mt-7 space-y-5">{feature.workflow.map((step, index) => <li key={step} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 font-mono text-xs text-primary">0{index + 1}</span><span className="pt-1 text-sm leading-6 text-muted-foreground">{step}</span></li>)}</ol></CardContent></Card>
      </section>

      <section className="border-y border-border bg-foreground/[0.025]"><div className="mx-auto max-w-4xl px-5 py-20 sm:px-8"><h2 className="text-center text-3xl font-semibold tracking-[-0.035em]">Frequently asked questions</h2><div className="mt-10 space-y-3">{feature.faq.map((item) => <Card key={item.question} className="border-border bg-card/65"><CardContent className="p-5 sm:p-6"><h3 className="font-medium">{item.question}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p></CardContent></Card>)}</div></div></section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Related workflows</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Go deeper on a real search intent.</h2></div><Link href="/ai-video-models" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">Compare video models <ArrowRight className="size-3.5" /></Link></div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {searchIntentPages.map((page) => <Card key={page.slug} className="border-border bg-card/65"><CardContent className="p-6"><h3 className="text-lg font-semibold">{page.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{page.description}</p><Link href={`/tools/${page.slug}` as Route} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Explore workflow <ArrowRight className="size-3.5" /></Link></CardContent></Card>)}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
