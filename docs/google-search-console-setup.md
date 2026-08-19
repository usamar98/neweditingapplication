# Google Search Console setup for Editing App

The canonical production site is `https://www.editingapp.live/`. The apex `https://editingapp.live/` redirects permanently to the `www` host, so Search Console, canonical tags, backlinks, and sitemap entries should use `www` consistently.

## Recommended ownership method: Domain property

1. Open Google Search Console and choose **Add property**.
2. Choose **Domain**.
3. Enter exactly: `editingapp.live`
4. Copy the unique TXT record Google provides into the DNS provider for `editingapp.live`.
5. Return to Search Console and click **Verify** after DNS has propagated.

A Domain property includes the apex, `www`, every protocol, and future subdomains. Google only supports DNS verification for this property type; there is no HTML file to upload.

## Alternative: URL-prefix property

If DNS access is unavailable:

1. Choose **URL prefix**.
2. Enter exactly: `https://www.editingapp.live/`
3. Select **HTML tag** and copy only the value inside the tag's `content="..."` attribute.
4. Add that value to the public Railway web service as `GOOGLE_SITE_VERIFICATION` (token only, without the surrounding meta tag).
5. Redeploy, confirm the tag is present in the homepage `<head>`, and click **Verify**.

The application already reads `GOOGLE_SITE_VERIFICATION` through Next.js metadata. Do not prefix this variable with `NEXT_PUBLIC_`, and do not paste the whole `<meta>` element.

If Google requires the HTML-file method instead, download Google's unique file unchanged and place it at `public/google<unique-token>.html`. The exact filename and content must come from your Search Console account; a placeholder file cannot verify ownership.

## Exact sitemap submission

Do not upload a TypeScript file to Search Console. Open **Sitemaps** and enter:

`sitemap.xml`

Google will fetch this exact public URL:

`https://www.editingapp.live/sitemap.xml`

The source file that generates it is `src/app/sitemap.ts`. The live file is also declared in `https://www.editingapp.live/robots.txt`.

## Production files to verify

- `https://www.editingapp.live/robots.txt`
- `https://www.editingapp.live/sitemap.xml`
- `https://www.editingapp.live/favicon.svg`
- `https://www.editingapp.live/icon-192.png`
- `https://www.editingapp.live/logo-512.png`
- `https://www.editingapp.live/manifest.webmanifest`
- `https://www.editingapp.live/opengraph-image`
- `https://www.editingapp.live/llms.txt`

The 512px PNG is the preferred Organization structured-data logo. The square SVG and PNG icons are stable, crawlable favicon candidates. Google chooses whether and when a favicon appears, so a valid file is not a guarantee of immediate display.

## First indexing requests

After verification and sitemap submission, inspect and request indexing for these URLs in order:

1. `https://www.editingapp.live/`
2. `https://www.editingapp.live/features`
3. `https://www.editingapp.live/tools`
4. `https://www.editingapp.live/tools/ai-video-generator`
5. `https://www.editingapp.live/tools/image-to-video-ai`
6. `https://www.editingapp.live/tools/ai-image-generator`
7. `https://www.editingapp.live/tools/long-video-to-shorts`
8. `https://www.editingapp.live/tools/product-url-to-video`
9. `https://www.editingapp.live/tools/product-photo-background-remover`
10. `https://www.editingapp.live/ai-video-models`

Do not request indexing for `/generate/*`, `/clipper`, `/creative-studio/*`, `/remove-background`, account, dashboard, or project URLs. Those are application workspaces and deliberately emit `noindex`.

## Keyword-to-page map

| Search intent | Primary page |
| --- | --- |
| AI video generator, text to video AI | `/tools/ai-video-generator` |
| image to video AI, photo to video AI | `/tools/image-to-video-ai` |
| AI image generator, AI product image generator | `/tools/ai-image-generator` |
| long video to shorts, AI clip maker | `/tools/long-video-to-shorts` |
| product URL to video, AI video ad generator | `/tools/product-url-to-video` |
| product photo background remover | `/tools/product-photo-background-remover` |
| Seedance vs Veo vs Kling vs LTX | `/ai-video-models` |

Review impressions and clicks by page and query after enough data exists. Improve pages with high impressions and low click-through rate before creating overlapping pages for the same keyword.

Submitting a sitemap and requesting indexing help discovery but do not guarantee ranking. Review Page Indexing, Core Web Vitals, Enhancements, Links, and non-brand query performance after Google has recrawled the deployment.
