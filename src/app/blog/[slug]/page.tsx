import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock3, Lightbulb, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingFooter } from "@/components/marketing-footer";
import { blogPosts, formatBlogDate, getBlogPost } from "@/lib/blog";
import { brandLogoPath, getSiteUrl, siteName } from "@/lib/site";

type BlogPostPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.seoTitle,
    description: post.description,
    keywords: [...post.keywords],
    alternates: { canonical: `/blog/${post.slug}` },
    authors: [{ name: "Editing App Editorial Team", url: "/blog" }],
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.modifiedAt,
      authors: ["Editing App Editorial Team"],
      tags: [...post.keywords],
      images: [{ url: post.cover.src, width: post.cover.width, height: post.cover.height, alt: post.coverAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [{ url: post.cover.src, alt: post.coverAlt }],
    },
  };
}

function headingId(heading: string) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const postUrl = new URL(`/blog/${post.slug}`, siteUrl).toString();
  const imageUrl = new URL(post.cover.src, siteUrl).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${postUrl}#article`,
        headline: post.title,
        description: post.description,
        image: [imageUrl],
        datePublished: post.publishedAt,
        dateModified: post.modifiedAt,
        mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
        author: { "@type": "Organization", name: "Editing App Editorial Team", url: new URL("/blog", siteUrl).toString() },
        publisher: { "@type": "Organization", name: siteName, url: siteUrl.toString(), logo: { "@type": "ImageObject", url: new URL(brandLogoPath, siteUrl).toString(), width: 512, height: 512 } },
        articleSection: post.category,
        keywords: post.keywords.join(", "),
        inLanguage: "en",
      },
      {
        "@type": "FAQPage",
        mainEntity: post.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl.toString() },
          { "@type": "ListItem", position: 2, name: "Guides", item: new URL("/blog", siteUrl).toString() },
          { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
        ],
      },
    ],
  };

  const relatedPosts = blogPosts.filter((candidate) => candidate.slug !== post.slug).slice(0, 3);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[700px]" />

      <article className="relative">
        <header className="mx-auto max-w-6xl px-5 pb-12 pt-12 sm:px-8 lg:pb-16 lg:pt-20">
          <nav aria-label="Breadcrumb" className="mb-10 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><Link href={"/blog" as Route} className="hover:text-foreground">Guides</Link><span className="mx-2">/</span><span className="line-clamp-1 inline align-bottom">{post.title}</span>
          </nav>
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">{post.category}</Badge>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-6xl">{post.title}</h1>
            <p className="mx-auto mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">{post.description}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Editing App Editorial Team</span><span aria-hidden="true">·</span><time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{post.readingTime}</span>
            </div>
          </div>
          <div className="relative mx-auto mt-10 aspect-video max-w-5xl overflow-hidden rounded-3xl border border-border bg-muted shadow-2xl shadow-black/10">
            <Image src={post.cover} alt={post.coverAlt} fill placeholder="blur" priority sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
            <span className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white/80 backdrop-blur">AI-generated editorial illustration</span>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-14 lg:pb-32">
          <div className="min-w-0">
            <Card className="border-primary/15 bg-primary/[0.045]">
              <CardContent className="p-6 sm:p-8">
                <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Lightbulb className="size-4" /> Quick answer</p>
                <p className="mt-4 text-base leading-8 text-foreground/90">{post.quickAnswer}</p>
              </CardContent>
            </Card>

            <section aria-labelledby="key-takeaways" className="mt-10 rounded-2xl border border-border bg-card/50 p-6 sm:p-8">
              <h2 id="key-takeaways" className="text-2xl font-semibold tracking-[-0.03em]">Key takeaways</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {post.takeaways.map((takeaway) => <li key={takeaway} className="flex gap-2.5 text-sm leading-6 text-muted-foreground"><span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-3" /></span>{takeaway}</li>)}
              </ul>
            </section>

            <div className="mt-12 space-y-12">
              {post.sections.map((section) => (
                <section key={section.heading} aria-labelledby={headingId(section.heading)} className="scroll-mt-24">
                  <h2 id={headingId(section.heading)} className="text-balance text-3xl font-semibold tracking-[-0.035em]">{section.heading}</h2>
                  <div className="mt-5 space-y-5 text-base leading-8 text-muted-foreground">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                  {section.bullets ? (
                    <ul className="mt-6 space-y-3">
                      {section.bullets.map((bullet) => <li key={bullet.title} className="rounded-xl border border-border bg-card/55 p-4 text-sm leading-6 text-muted-foreground"><strong className="font-semibold text-foreground">{bullet.title}:</strong> {bullet.detail}</li>)}
                    </ul>
                  ) : null}
                  {section.note ? <aside className="mt-6 border-l-2 border-primary bg-primary/[0.035] px-5 py-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Practical note:</strong> {section.note}</aside> : null}
                </section>
              ))}
            </div>

            <Card className="mt-12 border-primary/15 bg-primary/[0.05]">
              <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div><p className="text-sm font-medium text-primary">Put the workflow into practice</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Move from the guide to the workspace.</h2></div>
                <Button asChild className="shrink-0"><Link href={post.primaryCta.href as Route}>{post.primaryCta.label}<ArrowRight className="size-4" /></Link></Button>
              </CardContent>
            </Card>

            <section aria-labelledby="frequently-asked-questions" className="mt-14">
              <h2 id="frequently-asked-questions" className="text-3xl font-semibold tracking-[-0.035em]">Frequently asked questions</h2>
              <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card/50">
                {post.faqs.map((faq) => <details key={faq.question} className="group p-5 open:bg-primary/[0.025] sm:p-6"><summary className="cursor-pointer list-none pr-8 font-medium [&::-webkit-details-marker]:hidden">{faq.question}<span aria-hidden="true" className="float-right -mr-6 text-primary transition group-open:rotate-45">+</span></summary><p className="mt-4 text-sm leading-7 text-muted-foreground">{faq.answer}</p></details>)}
              </div>
            </section>

            <section aria-labelledby="continue-learning" className="mt-14">
              <h2 id="continue-learning" className="text-2xl font-semibold tracking-[-0.03em]">Continue learning</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {relatedPosts.map((related) => <Link key={related.slug} href={`/blog/${related.slug}` as Route} className="group rounded-xl border border-border bg-card/50 p-4 transition hover:border-primary/25 hover:bg-card"><p className="text-xs font-medium text-primary">{related.category}</p><h3 className="mt-2 text-sm font-semibold leading-5 group-hover:text-primary">{related.title}</h3><span className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">Read guide <ArrowRight className="size-3" /></span></Link>)}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <nav aria-label="Table of contents" className="rounded-2xl border border-border bg-card/70 p-5">
              <p className="text-sm font-semibold">In this guide</p>
              <ol className="mt-4 space-y-2.5 text-sm leading-5 text-muted-foreground">
                {post.sections.map((section, index) => <li key={section.heading}><a href={`#${headingId(section.heading)}`} className="grid grid-cols-[1.25rem_1fr] gap-1 hover:text-foreground"><span className="font-mono text-[10px] text-primary">{String(index + 1).padStart(2, "0")}</span><span>{section.heading}</span></a></li>)}
              </ol>
            </nav>
            <div className="rounded-2xl border border-border bg-card/70 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold"><Link2 className="size-4 text-primary" /> Related tools</p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {post.relatedLinks.map((link) => <li key={link.href}><Link href={link.href as Route} className="inline-flex items-start gap-1.5 hover:text-primary">{link.label}<ArrowRight className="mt-1 size-3 shrink-0" /></Link></li>)}
              </ul>
            </div>
            <p className="px-1 text-xs leading-5 text-muted-foreground">Reviewed {formatBlogDate(post.modifiedAt)}. Provider capabilities, platform rules, and model availability can change; verify current requirements before publishing commercial work.</p>
          </aside>
        </div>
      </article>

      <MarketingFooter />
    </main>
  );
}
