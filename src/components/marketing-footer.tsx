import type { Route } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Separator } from "@/components/ui/separator";
import { marketingFeatures } from "@/lib/marketing/features";
import { comparisonPages, searchIntentPages } from "@/lib/marketing/seo-pages";

const featureLabels: Record<(typeof marketingFeatures)[number]["slug"], string> = {
  "ai-video-editor": "AI video editor",
  "ai-video-generator": "AI video generator",
  "ai-image-generator": "AI image generator",
  "performance-creative-studio": "AI ad creative studio",
  "background-remover": "AI background remover",
};

const toolLabels: Record<(typeof searchIntentPages)[number]["slug"], string> = {
  "product-url-to-video": "Product URL to video",
  "long-video-to-shorts": "Long video to shorts",
};

export function MarketingFooter() {
  return (
    <footer className="mx-auto max-w-7xl px-5 pb-10 pt-6 sm:px-8">
      <Separator className="mb-10" />
      <div className="grid gap-10 md:grid-cols-[1.25fr_2fr]">
        <div className="max-w-sm">
          <Brand />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            A private, multi-model workspace for AI video editing, generation, campaign images,
            product ads, short-form clips, and precise background removal.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="grid gap-8 sm:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold">Creative features</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link href={"/features" as Route} className="hover:text-foreground">All AI features</Link></li>
              {marketingFeatures.map((feature) => (
                <li key={feature.slug}>
                  <Link href={`/features/${feature.slug}` as Route} className="hover:text-foreground">
                    {featureLabels[feature.slug]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Popular workflows</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link href={"/tools" as Route} className="hover:text-foreground">All AI workflows</Link></li>
              {searchIntentPages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/tools/${page.slug}` as Route} className="hover:text-foreground">
                    {toolLabels[page.slug]}
                  </Link>
                </li>
              ))}
              <li><Link href="/ai-video-models" className="hover:text-foreground">AI video model guide</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Compare and plan</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link href={"/pricing" as Route} className="hover:text-foreground">Plans and pricing</Link></li>
              <li><Link href={"/compare" as Route} className="hover:text-foreground">All comparisons</Link></li>
              {comparisonPages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/compare/${page.slug}` as Route} className="hover:text-foreground">
                    Editing App vs {page.competitor}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
      <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Editing App. Model availability and provider capabilities can change.
      </p>
    </footer>
  );
}
