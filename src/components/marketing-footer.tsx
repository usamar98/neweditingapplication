import type { Route } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { blogPosts } from "@/lib/blog";
import { marketingFeatures } from "@/lib/marketing/features";
import { comparisonPages, searchIntentPages } from "@/lib/marketing/seo-pages";

const featureLabels: Record<(typeof marketingFeatures)[number]["slug"], string> = {
  "ai-clipper": "AI Clipper",
  "ai-video-generator": "AI video generator",
  "image-to-video-generator": "AI image to video generator",
  "ai-image-generator": "AI image generator",
  "ai-image-ad-creator": "AI image ad creator",
  "ai-video-ad-creator": "AI video ad creator",
  "background-remover": "AI background remover",
};

const toolLabels: Record<(typeof searchIntentPages)[number]["slug"], string> = {
  "product-url-to-video": "Product URL to video",
  "long-video-to-shorts": "Long video to shorts",
};

export function MarketingFooter() {
  return (
    <footer className="mx-auto max-w-7xl px-5 pb-10 pt-6 sm:px-8">
      <div aria-hidden="true" className="mb-10 h-px w-full bg-border" />
      <div className="grid gap-10 md:grid-cols-[1.25fr_2fr]">
        <div className="max-w-sm">
          <Brand />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            A private, multi-model workspace for AI clipping, text-to-video, image-to-video, campaign images,
            product ads, short-form content, and precise background removal.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <h2 className="text-sm font-semibold">Creative features</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link href={"/features" as Route} className="hover:text-foreground">All AI features</Link></li>
              {marketingFeatures.map((feature) => (
                <li key={feature.slug}>
                  <Link href={feature.href} className="hover:text-foreground">
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
              <li><Link href={"/blog" as Route} className="hover:text-foreground">Creative guides</Link></li>
              {searchIntentPages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/tools/${page.slug}` as Route} className="hover:text-foreground">
                    {toolLabels[page.slug]}
                  </Link>
                </li>
              ))}
              <li><Link href="/ai-video-models" className="hover:text-foreground">AI video model guide</Link></li>
              {blogPosts.slice(0, 2).map((post) => (
                <li key={post.slug}><Link href={`/blog/${post.slug}` as Route} className="hover:text-foreground">{post.seoTitle}</Link></li>
              ))}
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
          <div>
            <h2 className="text-sm font-semibold">Trust & legal</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link href={"/legal" as Route} className="hover:text-foreground">Legal Center</Link></li>
              <li><Link href={"/legal/terms" as Route} className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link href={"/legal/privacy" as Route} className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href={"/legal/subscriptions-credits-refunds" as Route} className="hover:text-foreground">Billing & refunds</Link></li>
              <li><Link href={"/legal/acceptable-use" as Route} className="hover:text-foreground">Acceptable use</Link></li>
              <li><Link href={"/legal/security" as Route} className="hover:text-foreground">Security</Link></li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Editing App. Model availability and provider capabilities can change.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2"><Link href={"/legal/privacy" as Route} className="hover:text-foreground">Privacy</Link><Link href={"/legal/terms" as Route} className="hover:text-foreground">Terms</Link><Link href={"/legal/cookies" as Route} className="hover:text-foreground">Cookies</Link></div>
      </div>
    </footer>
  );
}
