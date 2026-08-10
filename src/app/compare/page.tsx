import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { comparisonPages } from "@/lib/marketing/seo-pages";
import { getSiteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Video Tool Comparisons",
  description: "Compare Editing App with VEED, Creatify, and OpusClip across AI video editing, generation, product ads, long-video repurposing, and model choice.",
  alternates: { canonical: "/compare" },
  openGraph: { title: "AI Video Tool Comparisons", description: "Balanced comparisons for AI video creation, product ads, and short-form repurposing.", type: "website", url: "/compare" },
  twitter: { card: "summary_large_image", title: "AI Video Tool Comparisons", description: "Compare Editing App with VEED, Creatify, and OpusClip." },
};

export default function ComparePage() {
  const siteUrl = getSiteUrl();
  const pageUrl = new URL("/compare", siteUrl).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: metadata.title, description: metadata.description, url: pageUrl, dateModified: "2026-08-10", isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl.toString() }, mainEntity: { "@type": "ItemList", itemListElement: comparisonPages.map((page, index) => ({ "@type": "ListItem", position: index + 1, name: page.title, url: new URL(`/compare/${page.slug}`, siteUrl).toString() })) } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl.toString() }, { "@type": "ListItem", position: 2, name: "Comparisons", item: pageUrl }] },
    ],
  };
  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[580px]" />
      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 lg:pb-24 lg:pt-24">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><span>Comparisons</span></nav>
        <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary"><Scale className="size-3.5" /> Reviewed comparisons</Badge>
        <h1 className="mt-6 max-w-5xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Compare AI video tools by the workflow that matters.</h1>
        <p className="mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">Evaluate model choice, editing control, product ads, long-video clipping, delivery, collaboration, and publishing—along with each platform&apos;s strongest use case.</p>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {comparisonPages.map((page) => <Card key={page.slug} className="border-border bg-card/70"><CardContent className="flex h-full flex-col p-6"><p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">Editing App vs {page.competitor}</p><h2 className="mt-3 text-xl font-semibold tracking-[-0.025em]">{page.title}</h2><p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{page.summary}</p><Link href={`/compare/${page.slug}` as Route} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Read the {page.competitor} comparison <ArrowRight className="size-3.5" /></Link></CardContent></Card>)}
        </div>
        <p className="mt-8 max-w-4xl text-xs leading-5 text-muted-foreground">These comparisons use publicly available product information and identify where each product may be the better fit. Product capabilities change, so verify purchase-critical features with each provider.</p>
      </section>
      <MarketingFooter />
    </main>
  );
}
