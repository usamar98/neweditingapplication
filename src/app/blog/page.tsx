import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, SearchCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingFooter } from "@/components/marketing-footer";
import { blogPosts, formatBlogDate } from "@/lib/blog";
import { getSiteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Video, Image & Creative Workflow Guides",
  description: "Practical, human-reviewed guides for AI video, AI images, product photography, background removal, short-form clipping, and ad creative.",
  keywords: ["AI video guides", "AI image guides", "AI creative workflow", "AI product photography", "AI clipper guide", "background remover guide"],
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "AI Video, Image & Creative Workflow Guides",
    description: "Practical, human-reviewed guidance for producing stronger AI creative.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Video, Image & Creative Workflow Guides",
    description: "Practical, human-reviewed guidance for producing stronger AI creative.",
  },
};

export default function BlogPage() {
  const blogUrl = new URL("/blog", getSiteUrl()).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${blogUrl}#blog`,
        name: "Editing App creative guides",
        description: metadata.description,
        url: blogUrl,
        publisher: { "@type": "Organization", name: siteName, url: getSiteUrl().toString() },
        blogPost: blogPosts.map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: new URL(`/blog/${post.slug}`, getSiteUrl()).toString(),
          datePublished: post.publishedAt,
          dateModified: post.modifiedAt,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: getSiteUrl().toString() },
          { "@type": "ListItem", position: 2, name: "Guides", item: blogUrl },
        ],
      },
    ],
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[620px]" />

      <section className="relative mx-auto max-w-7xl px-5 pb-14 pt-14 sm:px-8 lg:pb-20 lg:pt-24">
        <nav aria-label="Breadcrumb" className="mb-10 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link><span className="mx-2">/</span><span>Guides</span>
        </nav>
        <div className="grid gap-10 lg:grid-cols-[1fr_.7fr] lg:items-end">
          <div>
            <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary"><BookOpen className="mr-1 size-3.5" /> Editing App field guide</Badge>
            <h1 className="mt-6 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Useful AI creative guidance, written for the work after the prompt.</h1>
            <p className="mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">Practical workflows for choosing models, protecting product truth, finding stronger clips, and moving AI-generated creative through a real review process.</p>
          </div>
          <Card className="border-primary/15 bg-primary/[0.045]">
            <CardContent className="p-6">
              <p className="text-sm font-semibold">Our editorial standard</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li className="flex gap-2.5"><SearchCheck className="mt-1 size-4 shrink-0 text-primary" /> Search intent and current product capabilities shape each topic.</li>
                <li className="flex gap-2.5"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" /> Every guide is human-reviewed and avoids invented performance promises.</li>
                <li className="flex gap-2.5"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" /> Model availability and platform rules are treated as changeable, not permanent facts.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:pb-32" aria-labelledby="latest-guides">
        <div className="mb-8 flex items-end justify-between gap-6 border-b border-border pb-5">
          <div><p className="text-sm font-medium text-primary">Search-led learning center</p><h2 id="latest-guides" className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Latest practical guides</h2></div>
          <p className="hidden max-w-md text-right text-sm leading-6 text-muted-foreground md:block">Built around the creative questions people search for—and the decisions they still need to make after opening a tool.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post, index) => (
            <article key={post.slug} className={index === 0 ? "md:col-span-2 lg:col-span-2" : undefined}>
              <Link href={`/blog/${post.slug}` as Route} className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="h-full overflow-hidden border-border bg-card/65 transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/25 group-hover:shadow-xl">
                  <div className={index === 0 ? "relative aspect-[2/1] overflow-hidden bg-muted" : "relative aspect-video overflow-hidden bg-muted"}>
                    <Image src={post.cover} alt={post.coverAlt} fill placeholder="blur" sizes={index === 0 ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"} className="object-cover transition duration-700 group-hover:scale-[1.025]" priority={index === 0} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
                    <Badge className="absolute bottom-4 left-4 border-white/15 bg-black/45 text-white backdrop-blur">{post.category}</Badge>
                  </div>
                  <CardContent className={index === 0 ? "p-6 sm:p-8" : "p-6"}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time><span aria-hidden="true">·</span><span>{post.readingTime}</span></div>
                    <h2 className={index === 0 ? "mt-3 text-balance text-2xl font-semibold tracking-[-0.035em] sm:text-3xl" : "mt-3 text-balance text-xl font-semibold tracking-[-0.025em]"}>{post.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Read the guide <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></span>
                  </CardContent>
                </Card>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
