import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, FileCheck2, LockKeyhole, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { legalContactEmail, legalDocuments, legalEffectiveDate } from "@/lib/legal";
import { getSiteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Legal Center",
  description: "Editing App terms, privacy, subscriptions, credits, refunds, acceptable use, AI policy, cookies, subprocessors, security, content complaints, and accessibility.",
  alternates: { canonical: "/legal" },
  openGraph: { title: "Editing App Legal Center", description: "Clear terms and policies for accounts, creative content, AI, privacy, and billing.", type: "website", url: "/legal" },
};

const trustPoints = [
  { icon: LockKeyhole, title: "Private creative workspace", text: "Project sources, prompts, transcripts, and outputs are intended to remain private to your account. Profile pictures are public assets." },
  { icon: CreditCard, title: "Online billing control", text: "Subscriptions renew until cancelled and can be managed or cancelled online from Account settings." },
  { icon: Sparkles, title: "Human review for AI", text: "You keep responsibility for rights, accuracy, disclosure, and final approval of generated content." },
] as const;

export default function LegalCenterPage() {
  const siteUrl = getSiteUrl();
  const pageUrl = new URL("/legal", siteUrl).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Editing App Legal Center",
    description: metadata.description,
    url: pageUrl,
    isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl.toString() },
    hasPart: legalDocuments.map((document) => ({ "@type": "WebPage", name: document.title, url: new URL(`/legal/${document.slug}`, siteUrl).toString() })),
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[620px]" />
      <section className="relative mx-auto max-w-7xl px-5 pb-12 pt-12 sm:px-8 lg:pt-20">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><span>Legal Center</span></nav>
        <div className="max-w-4xl">
          <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary"><Scale className="size-3.5" /> Trust and legal</Badge>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Clear rules for creative work, AI, privacy, and billing.</h1>
          <p className="mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">These documents explain what Editing App provides, what you control, how data and payments are handled, and the standards that protect users and rights holders.</p>
          <p className="mt-5 text-xs text-muted-foreground">Current version effective {legalEffectiveDate}</p>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {trustPoints.map((item) => <Card key={item.title} className="border-border bg-card/75"><CardContent className="p-5 sm:p-6"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><item.icon className="size-4.5" /></span><h2 className="mt-5 font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></CardContent></Card>)}
        </div>
      </section>

      <section className="border-y border-border bg-foreground/[0.02]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Policy library</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Documents for every important touchpoint</h2></div><p className="max-w-lg text-sm leading-6 text-muted-foreground">Accounts, uploads, AI generation, recurring payments, cancellation, deletion, and rights complaints are each covered.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {legalDocuments.map((document) => (
              <Link key={document.slug} href={`/legal/${document.slug}` as Route} className="group rounded-2xl border border-border bg-card/75 p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:p-6">
                <div className="flex items-start justify-between gap-4"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><FileCheck2 className="size-4.5" /></span><ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></div>
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.025em]">{document.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{document.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <Card className="border-primary/20 bg-primary/[0.045]"><CardContent className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-primary"><ShieldCheck className="size-4" /><span className="text-sm font-medium">Business and rights requests</span></div><h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">Need privacy help or marketplace diligence?</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Contact us for privacy requests, billing review, accessibility formats, security disclosure, rights complaints, or business data-processing discussions.</p></div><a href={`mailto:${legalContactEmail}`} className="shrink-0 rounded-xl bg-primary px-5 py-3 text-center text-sm font-medium text-primary-foreground shadow-lg shadow-primary/10">{legalContactEmail}</a></CardContent></Card>
      </section>
      <MarketingFooter />
    </main>
  );
}
