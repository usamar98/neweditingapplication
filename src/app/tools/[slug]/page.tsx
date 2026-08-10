import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingFooter } from "@/components/marketing-footer";
import { getSearchIntentPage, searchIntentPages } from "@/lib/marketing/seo-pages";
import { getSiteUrl, siteName } from "@/lib/site";

type ToolPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return searchIntentPages.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const page = getSearchIntentPage((await params).slug);
  if (!page) return {};
  const path = `/tools/${page.slug}`;
  return {
    title: page.seoTitle,
    description: page.description,
    alternates: { canonical: path },
    openGraph: { title: page.seoTitle, description: page.description, type: "website", url: path },
    twitter: { card: "summary_large_image", title: page.seoTitle, description: page.description },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const page = getSearchIntentPage((await params).slug);
  if (!page) notFound();

  const pageUrl = new URL(`/tools/${page.slug}`, getSiteUrl()).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: pageUrl,
        dateModified: "2026-08-10",
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: siteName, url: getSiteUrl().toString() },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: getSiteUrl().toString() },
          { "@type": "ListItem", position: 2, name: "Tools", item: new URL("/tools", getSiteUrl()).toString() },
          { "@type": "ListItem", position: 3, name: page.eyebrow, item: pageUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faq.map((item) => ({
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
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[640px]" />

      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 lg:pb-24 lg:pt-24">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><Link href={"/tools" as Route} className="hover:text-foreground">Tools</Link><span className="mx-2">/</span><span>{page.eyebrow}</span>
        </nav>
        <div className="max-w-4xl">
          <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary"><Sparkles className="size-3.5" /> {page.eyebrow}</Badge>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{page.title}</h1>
          <p className="mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">{page.intro}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild><Link href={page.primaryHref}>{page.primaryLabel} <ArrowRight className="size-4" /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link href={page.featureHref}>Explore all capabilities</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-20 sm:px-8 lg:grid-cols-2 lg:pb-28">
        <Card className="border-border bg-card/70">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">What you can produce</h2>
            <div className="mt-7 grid gap-3">
              {page.outcomes.map((outcome) => <div key={outcome} className="flex gap-3 rounded-xl border border-border bg-muted/55 p-4 text-sm leading-6 text-muted-foreground"><Check className="mt-1 size-4 shrink-0 text-primary" />{outcome}</div>)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/15 bg-primary/[0.045]">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">How the workflow works</h2>
            <ol className="mt-7 space-y-5">
              {page.steps.map((step, index) => <li key={step} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 font-mono text-xs text-primary">0{index + 1}</span><span className="pt-1 text-sm leading-6 text-muted-foreground">{step}</span></li>)}
            </ol>
          </CardContent>
        </Card>
      </section>

      <section className="border-y border-border bg-foreground/[0.025]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.035em]">Built for repeatable creative work</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {page.useCases.map((useCase) => <div key={useCase} className="rounded-xl border border-border bg-card/65 p-5 text-sm font-medium">{useCase}</div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
        <h2 className="text-center text-3xl font-semibold tracking-[-0.035em]">Frequently asked questions</h2>
        <div className="mt-10 space-y-3">
          {page.faq.map((item) => <Card key={item.question} className="border-border bg-card/65"><CardContent className="p-5 sm:p-6"><h3 className="font-medium">{item.question}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p></CardContent></Card>)}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="rounded-2xl border border-primary/15 bg-primary/[0.045] p-6 sm:p-8">
          <p className="text-sm font-medium text-primary">Continue exploring</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Connect this workflow to the complete creative suite.</h2>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-primary">
            <Link href={page.featureHref}>View related feature capabilities <ArrowRight className="ml-1 inline size-3.5" /></Link>
            <Link href={"/ai-video-models" as Route}>Compare AI video models <ArrowRight className="ml-1 inline size-3.5" /></Link>
            <Link href={"/pricing" as Route}>Compare plans and credits <ArrowRight className="ml-1 inline size-3.5" /></Link>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
