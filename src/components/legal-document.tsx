import type { Route } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Mail } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { legalContactEmail, legalDocuments, legalEffectiveDate, type LegalDocument as LegalDocumentData } from "@/lib/legal";

export function LegalDocument({ document }: { document: LegalDocumentData }) {
  return (
    <main className="relative min-h-screen overflow-hidden print:overflow-visible">
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[500px] print:hidden" />
      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 lg:pt-16">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-xs text-muted-foreground print:hidden">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={"/legal" as Route} className="hover:text-foreground">Legal Center</Link>
          <span aria-hidden="true">/</span>
          <span>{document.shortTitle}</span>
        </nav>

        <header className="max-w-4xl border-b border-border pb-10">
          <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">Legal document</Badge>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{document.title}</h1>
          <p className="mt-5 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">{document.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2"><CalendarDays className="size-3.5 text-primary" /> Effective {legalEffectiveDate}</span>
            <a className="inline-flex items-center gap-2 hover:text-foreground" href={`mailto:${legalContactEmail}`}><Mail className="size-3.5 text-primary" /> {legalContactEmail}</a>
          </div>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <article className="min-w-0 max-w-4xl">
            <div className="mb-10 rounded-2xl border border-primary/15 bg-primary/[0.045] p-5 text-sm leading-7 text-muted-foreground sm:p-6">
              {document.summary}
            </div>
            <div className="space-y-12">
              {document.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-[-0.035em] text-foreground">{section.title}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 text-[15px] leading-7 text-muted-foreground">{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul className="mt-5 space-y-3 text-[15px] leading-7 text-muted-foreground">
                      {section.bullets.map((item) => (
                        <li key={item} className="flex gap-3"><span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-primary" /><span>{item}</span></li>
                      ))}
                    </ul>
                  ) : null}
                  {section.note ? <p className="mt-5 rounded-xl border border-border bg-muted/55 p-4 text-sm leading-6 text-foreground/80">{section.note}</p> : null}
                </section>
              ))}
            </div>
          </article>

          <aside className="rounded-2xl border border-border bg-card/75 p-5 lg:sticky lg:top-24 print:hidden">
            <h2 className="text-sm font-semibold">On this page</h2>
            <ol className="mt-4 space-y-2.5 text-xs leading-5 text-muted-foreground">
              {document.sections.map((section) => <li key={section.id}><a href={`#${section.id}`} className="hover:text-foreground">{section.title}</a></li>)}
            </ol>
            <div className="my-5 h-px bg-border" />
            <h2 className="text-sm font-semibold">Other documents</h2>
            <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
              {legalDocuments.filter((item) => item.slug !== document.slug).map((item) => (
                <li key={item.slug}><Link href={`/legal/${item.slug}` as Route} className="hover:text-foreground">{item.shortTitle}</Link></li>
              ))}
            </ul>
          </aside>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Button asChild variant="outline"><Link href={"/legal" as Route}><ArrowLeft className="size-4" /> Back to Legal Center</Link></Button>
          <p className="text-sm text-muted-foreground">Need another format or have a question? <a href={`mailto:${legalContactEmail}`} className="font-medium text-primary hover:underline">Contact Legal</a></p>
        </div>
      </div>
      <div className="print:hidden"><MarketingFooter /></div>
    </main>
  );
}
