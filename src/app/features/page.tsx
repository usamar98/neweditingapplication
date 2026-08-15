import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingCardMedia } from "@/components/marketing-card-media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { marketingFeatures } from "@/lib/marketing/features";
import { getSiteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Creative Tools for Video, Images & Ads",
  description: "Explore Editing App's AI video editor, multi-model generators, image and video ad studio for online and local businesses, and precision background remover.",
  keywords: ["AI creative tools", "AI video editor", "AI video generator", "AI image generator", "AI ad generator", "local business ad generator", "AI background remover"],
  alternates: { canonical: "/features" },
  openGraph: {
    title: "AI Creative Tools for Video, Images & Ads",
    description: "One private workspace for AI video editing, generation, image and video ads, local-business campaigns, and background removal.",
    type: "website",
    url: "/features",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Creative Tools for Video, Images & Ads",
    description: "Explore the complete Editing App AI creative suite.",
  },
};

export default function FeaturesPage() {
  const siteUrl = getSiteUrl();
  const pageUrl = new URL("/features", siteUrl).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: metadata.title,
        description: metadata.description,
        url: pageUrl,
        isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl.toString() },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: marketingFeatures.map((feature, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: feature.cardTitle,
            url: new URL(feature.href, siteUrl).toString(),
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl.toString() },
          { "@type": "ListItem", position: 2, name: "Features", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[620px]" />
      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 text-center sm:px-8 lg:pb-24 lg:pt-24">
        <nav aria-label="Breadcrumb" className="mb-8 text-left text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><span>Features</span>
        </nav>
        <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary"><Sparkles className="size-3.5" /> AI creative suite</Badge>
        <h1 className="mx-auto mt-6 max-w-5xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
          AI creative tools for every stage from first brief to final export.
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">
          Edit long footage, generate premium video and images, build source-aware image and video ads for online or local businesses, and remove backgrounds in one private workspace.
        </p>
        <Button size="lg" asChild className="mt-8"><Link href="/generate/image?claim=welcome">Open the image studio <ArrowRight className="size-4" /></Link></Button>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {marketingFeatures.map((feature) => (
            <Link key={feature.slug} href={feature.href} aria-label={`Open ${feature.cardTitle}`} className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full overflow-hidden border-border bg-card/70 transition group-hover:-translate-y-1 group-hover:border-primary/25 group-hover:shadow-lg">
              <MarketingCardMedia slug={feature.slug} />
              <CardContent className="p-6 sm:p-8">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">{feature.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{feature.cardTitle}</h2>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{feature.description}</p>
                <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  {feature.benefits.slice(0, 4).map((benefit) => <li key={benefit} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{benefit}</li>)}
                </ul>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
        <div className="mt-12 grid gap-4 rounded-2xl border border-border bg-muted/45 p-6 sm:grid-cols-3 sm:p-8">
          <div className="sm:col-span-2"><h2 className="text-2xl font-semibold tracking-[-0.03em]">Choose the workflow, then the right model.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Compare real model limits, start from a product URL, or repurpose a long video with editorial control.</p></div>
          <div className="flex flex-col items-start gap-2 text-sm font-medium text-primary"><Link href={"/tools" as Route}>Browse outcome-based AI tools →</Link><Link href="/ai-video-models">Compare AI video models →</Link><Link href={"/pricing" as Route}>View plans and pricing →</Link></div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
