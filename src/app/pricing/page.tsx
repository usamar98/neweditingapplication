import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { PricingCards } from "@/components/pricing-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSiteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Video and Creative Studio Pricing",
  description: "Compare Editing App Creator, Studio, and Business plans for AI video, image, ad creative, editing, background removal, credits, and export quality.",
  alternates: { canonical: "/pricing" },
  openGraph: { title: "AI Video and Creative Studio Pricing", description: "Choose an Editing App plan for AI video, images, ads, editing, and background removal.", type: "website", url: "/pricing" },
  twitter: { card: "summary_large_image", title: "AI Video and Creative Studio Pricing", description: "Compare Creator, Studio, and Business plans." },
};

const pricingFaq = [
  { question: "How do Editing App credits work?", answer: "Credits are a usage budget for AI generation and processing. Different models and settings can consume different amounts, so the app shows the applicable cost before a paid generation starts." },
  { question: "Does every plan unlock the same AI models?", answer: "Plan limits can differ by model tier, generation budget, and output quality. The generator also hides unsupported duration and resolution combinations for the selected model." },
  { question: "Can I cancel my subscription?", answer: "Yes. You can cancel from account billing. Access continues according to the subscription state returned by Stripe, and the account page shows the current status." },
  { question: "Are uploaded and generated files private?", answer: "Projects use private storage and short-lived signed links. Background jobs process media without publishing the source or result as a public asset." },
] as const;

export default function PricingPage() {
  const siteUrl = getSiteUrl();
  const pageUrl = new URL("/pricing", siteUrl).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: metadata.title, description: metadata.description, url: pageUrl, isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl.toString() }, mainEntity: { "@type": "SoftwareApplication", name: siteName, applicationCategory: "MultimediaApplication", operatingSystem: "Web", offers: [{ "@type": "Offer", name: "Creator", price: "29.99", priceCurrency: "USD" }, { "@type": "Offer", name: "Studio", price: "49.99", priceCurrency: "USD" }, { "@type": "Offer", name: "Business", price: "99.99", priceCurrency: "USD" }] } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl.toString() }, { "@type": "ListItem", position: 2, name: "Pricing", item: pageUrl }] },
      { "@type": "FAQPage", mainEntity: pricingFaq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ],
  };
  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[580px]" />
      <section className="relative mx-auto max-w-7xl px-5 pb-12 pt-16 text-center sm:px-8 lg:pt-24">
        <nav aria-label="Breadcrumb" className="mb-8 text-left text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><span>Pricing</span></nav>
        <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary"><CreditCard className="size-3.5" /> Monthly creative plans</Badge>
        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">AI creative studio pricing for every production pace.</h1>
        <p className="mx-auto mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">Choose a monthly plan with a clear generation budget, model-aware quality limits, private delivery, and secure Stripe checkout.</p>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-24 pt-6 sm:px-8"><PricingCards /></section>
      <section className="border-y border-border bg-foreground/[0.025]"><div className="mx-auto max-w-4xl px-5 py-20 sm:px-8"><h2 className="text-center text-3xl font-semibold tracking-[-0.035em]">Pricing and credit questions</h2><div className="mt-10 space-y-3">{pricingFaq.map((item) => <Card key={item.question} className="border-border bg-card/70"><CardContent className="p-5 sm:p-6"><h3 className="font-medium">{item.question}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p></CardContent></Card>)}</div><div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-medium text-primary"><Link href={"/features" as Route}>Explore all AI features <ArrowRight className="ml-1 inline size-3.5" /></Link><Link href="/ai-video-models">Compare AI video models <ArrowRight className="ml-1 inline size-3.5" /></Link></div></div></section>
      <MarketingFooter />
    </main>
  );
}
