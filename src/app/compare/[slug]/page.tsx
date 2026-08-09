import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { comparisonPages, getComparisonPage } from "@/lib/marketing/seo-pages";
import { getSiteUrl, siteName } from "@/lib/site";

type ComparisonPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return comparisonPages.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ComparisonPageProps): Promise<Metadata> {
  const page = getComparisonPage((await params).slug);
  if (!page) return {};
  const path = `/compare/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: path },
    openGraph: { title: page.title, description: page.description, type: "article", url: path },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

export default async function ComparisonPage({ params }: ComparisonPageProps) {
  const page = getComparisonPage((await params).slug);
  if (!page) notFound();

  const pageUrl = new URL(`/compare/${page.slug}`, getSiteUrl()).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: page.title, description: page.description, url: pageUrl, dateModified: "2026-08-09", isPartOf: { "@type": "WebSite", name: siteName, url: getSiteUrl().toString() } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: getSiteUrl().toString() },
        { "@type": "ListItem", position: 2, name: `Editing App vs ${page.competitor}`, item: pageUrl },
      ] },
    ],
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[620px]" />

      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 lg:pb-24 lg:pt-24">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><span>Comparisons</span><span className="mx-2">/</span><span>{page.competitor}</span></nav>
        <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary"><Scale className="size-3.5" /> Factual comparison · reviewed August 2026</Badge>
        <h1 className="mt-6 max-w-5xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{page.title}</h1>
        <p className="mt-6 max-w-4xl text-balance text-lg leading-8 text-muted-foreground">{page.summary}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild><Link href="/login?mode=signup">Try Editing App <ArrowRight className="size-4" /></Link></Button>
          <Button size="lg" variant="outline" asChild><a href={page.competitorUrl} target="_blank" rel="noreferrer">Visit {page.competitor} <ExternalLink className="size-4" /></a></Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary/20 bg-primary/[0.045]"><CardContent className="p-6 sm:p-8"><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Editing App is best for</p><p className="mt-4 leading-7 text-muted-foreground">{page.editingAppBestFor}</p></CardContent></Card>
          <Card className="border-white/[0.08] bg-card/55"><CardContent className="p-6 sm:p-8"><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{page.competitor} is best for</p><p className="mt-4 leading-7 text-muted-foreground">{page.competitorBestFor}</p></CardContent></Card>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08]">
          <div className="hidden grid-cols-[0.8fr_1.1fr_1.1fr] gap-5 border-b border-white/[0.08] bg-black/20 px-5 py-4 text-xs font-medium text-muted-foreground md:grid"><span>Capability</span><span>Editing App</span><span>{page.competitor}</span></div>
          {page.rows.map((row) => <div key={row.criterion} className="grid gap-3 border-b border-white/[0.06] bg-card/45 px-5 py-5 last:border-0 md:grid-cols-[0.8fr_1.1fr_1.1fr] md:gap-5"><strong className="text-sm">{row.criterion}</strong><p className="text-sm leading-6 text-muted-foreground"><span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-primary md:hidden">Editing App</span>{row.editingApp}</p><p className="text-sm leading-6 text-muted-foreground"><span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.14em] md:hidden">{page.competitor}</span>{row.competitor}</p></div>)}
        </div>

        <p className="mt-5 text-xs leading-5 text-muted-foreground">This comparison uses publicly available product information reviewed on August 9, 2026. Features change frequently; verify a critical capability with each provider before purchasing.</p>
      </section>
    </main>
  );
}
