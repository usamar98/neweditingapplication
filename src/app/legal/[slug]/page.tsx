import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/legal-document";
import { getLegalDocument, legalDocumentSlugs } from "@/lib/legal";
import { getSiteUrl, siteName } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return legalDocumentSlugs.map((slug) => ({ slug }));
}

type LegalPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) notFound();
  return {
    title: document.title,
    description: document.description,
    alternates: { canonical: `/legal/${document.slug}` },
    openGraph: { title: `${document.title} | Editing App`, description: document.description, type: "article", url: `/legal/${document.slug}` },
  };
}

export default async function LegalDocumentPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) notFound();
  const siteUrl = getSiteUrl();
  const pageUrl = new URL(`/legal/${document.slug}`, siteUrl).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: document.title, description: document.description, dateModified: "2026-08-10", url: pageUrl, isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl.toString() } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl.toString() },
        { "@type": "ListItem", position: 2, name: "Legal Center", item: new URL("/legal", siteUrl).toString() },
        { "@type": "ListItem", position: 3, name: document.title, item: pageUrl },
      ] },
    ],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><LegalDocument document={document} /></>;
}
