import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowRight, Check, WandSparkles } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingCardMedia } from "@/components/marketing-card-media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { searchIntentPages } from "@/lib/marketing/seo-pages";
import { getSiteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Video Tools for Ads & Short Clips",
  description: "Use focused AI workflows to turn a product URL into a video ad or repurpose long footage into editable clips for Reels, TikTok, Shorts, and Facebook.",
  keywords: ["AI video tools", "product URL to video", "URL to video ad", "long video to shorts", "AI clip maker", "ecommerce video ads"],
  alternates: { canonical: "/tools" },
  openGraph: { title: "AI Video Tools for Ads & Short Clips", description: "Outcome-based AI video workflows for ecommerce ads and long-video repurposing.", type: "website", url: "/tools" },
  twitter: { card: "summary_large_image", title: "AI Video Tools for Ads & Short Clips", description: "Turn product pages and long footage into channel-ready creative." },
};

export default function ToolsPage() {
  const siteUrl = getSiteUrl();
  const pageUrl = new URL("/tools", siteUrl).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: metadata.title, description: metadata.description, url: pageUrl, isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl.toString() }, mainEntity: { "@type": "ItemList", itemListElement: searchIntentPages.map((page, index) => ({ "@type": "ListItem", position: index + 1, name: page.title, url: new URL(`/tools/${page.slug}`, siteUrl).toString() })) } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl.toString() }, { "@type": "ListItem", position: 2, name: "Tools", item: pageUrl }] },
    ],
  };
  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[580px]" />
      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 lg:pb-24 lg:pt-24">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><span>Tools</span></nav>
        <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary"><WandSparkles className="size-3.5" /> Outcome-based workflows</Badge>
        <h1 className="mt-6 max-w-5xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">AI video tools built around the result you need.</h1>
        <p className="mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">Start with a real product page or owned long-form video. Editing App keeps the source, model choice, edits, and private delivery connected.</p>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          {searchIntentPages.map((page) => (
            <Card key={page.slug} className="overflow-hidden border-border bg-card/70">
              <MarketingCardMedia slug={page.slug} />
              <CardContent className="p-6 sm:p-8">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">{page.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{page.title}</h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{page.description}</p>
                <ul className="mt-6 space-y-3">{page.outcomes.map((outcome) => <li key={outcome} className="flex gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{outcome}</li>)}</ul>
                <Link href={`/tools/${page.slug}` as Route} className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Explore {page.eyebrow.toLowerCase()} <ArrowRight className="size-3.5" /></Link>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-5 rounded-2xl border border-primary/15 bg-primary/[0.045] p-6 sm:flex-row sm:items-center sm:p-8"><div><h2 className="text-xl font-semibold">Need the complete creative workspace?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Explore generation, editing, image, ad, and background-removal capabilities.</p></div><Button variant="outline" asChild><Link href={"/features" as Route}>Explore all features <ArrowRight className="size-4" /></Link></Button></div>
      </section>
      <MarketingFooter />
    </main>
  );
}
