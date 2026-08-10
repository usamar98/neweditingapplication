export const searchIntentPages = [
  {
    slug: "product-url-to-video",
    eyebrow: "Product URL to video",
    seoTitle: "Product URL to Video Ad Generator",
    title: "Product URL to video ad generator for ecommerce brands",
    description: "Turn a product page into a source-aware video ad for Facebook, Instagram, TikTok, or YouTube with selectable Seedance and Veo creative agents.",
    keywords: ["product URL to video", "URL to video ad", "AI video ad generator", "ecommerce video ads", "product video generator"],
    answer: {
      question: "Can AI turn a product URL into a video ad?",
      summary: "Yes. Editing App reads usable product facts and images from a public product page, combines them with your audience and channel choices, and prepares a source-aware video ad without inventing unsupported claims.",
      bestFor: "Shopify launches, DTC creative testing, agency campaigns, and ecommerce catalog refreshes.",
      input: "A public product URL, target audience, platform, message, and call to action.",
      output: "A grounded ad brief and platform-ready video creative for Meta, Instagram, TikTok, or YouTube.",
    },
    intro: "Paste a product URL, choose the audience and channel, and create a production brief grounded in the page's real images and product details. Editing App blocks unsupported claims before the paid render starts.",
    primaryHref: "/login?mode=signup",
    primaryLabel: "Create a product ad",
    featureHref: "/features/performance-creative-studio",
    outcomes: [
      "Source-aware scripts that use product-page facts",
      "Platform-specific framing for paid and organic placements",
      "Seedance 2.5 or Veo 3.1 ad-direction options",
      "Clear audience, hook, offer, and call-to-action controls",
    ],
    steps: [
      "Paste a public product URL and let the studio collect usable product context.",
      "Choose Facebook, Instagram, TikTok, or YouTube and define the audience.",
      "Select an ad director, review the source-aware brief, and generate the creative.",
      "Download the platform-ready master and create measured hook variations.",
    ],
    useCases: ["Shopify product launches", "DTC creative testing", "Agency client campaigns", "Catalog refreshes"],
    faq: [
      { question: "What does the AI read from a product URL?", answer: "The workflow uses available page metadata and media as source context for the creative brief. It does not treat page instructions as trusted application commands." },
      { question: "Can the generator invent a discount or customer review?", answer: "No. The planning guardrails block unsupported prices, discounts, guarantees, reviews, ingredients, and performance claims." },
      { question: "Which social platforms are supported?", answer: "Facebook, Instagram, TikTok, and YouTube are available with platform-aware placements, aspect ratios, pacing, and calls to action." },
      { question: "Can I choose the video model?", answer: "Yes. Choose an approved Seedance or Veo ad director, or use the source-aware routing option when available." },
    ],
  },
  {
    slug: "long-video-to-shorts",
    eyebrow: "Long video to shorts",
    seoTitle: "Long Video to Shorts AI Editor",
    title: "Turn long videos into short clips with AI-assisted editing",
    description: "Analyze long footage, find strong hooks, build captions, and prepare editable vertical clips for TikTok, Instagram Reels, YouTube Shorts, and Facebook.",
    keywords: ["long video to shorts", "AI clip maker", "podcast clip generator", "YouTube to Shorts", "video highlight generator"],
    answer: {
      question: "How do you turn a long video into short clips with AI?",
      summary: "Upload the long video, choose an analysis model, review ranked hooks and transcript-based suggestions, then refine captions, framing, and timing before exporting approved vertical or square clips.",
      bestFor: "Podcasts, interviews, webinars, tutorials, founder content, and YouTube repurposing.",
      input: "An owned long-form video and the analysis model you want to use.",
      output: "Editable short-form clips with captions and 9:16, 1:1, or 16:9 delivery options.",
    },
    intro: "Upload a recording once, choose the analysis model, and use scene, transcript, silence, and highlight suggestions to build short-form cuts without surrendering timeline control.",
    primaryHref: "/login?mode=signup",
    primaryLabel: "Upload a long video",
    featureHref: "/features/ai-video-editor",
    outcomes: [
      "Ranked highlight and hook suggestions",
      "Editable transcripts and word-timed captions",
      "9:16, 1:1, and 16:9 delivery formats",
      "Durable processing for large uploads",
    ],
    steps: [
      "Upload a podcast, interview, webinar, tutorial, or campaign recording.",
      "Choose Editor Autopilot, GPT-5 mini, Gemini, or the local analysis option.",
      "Review suggested highlights, silence, fillers, captions, and reframing.",
      "Keep full editorial control, then export a channel-ready MP4 master.",
    ],
    useCases: ["Podcast clips", "Founder interviews", "Webinar highlights", "YouTube-to-Reels workflows"],
    faq: [
      { question: "Does Editing App automatically publish the clips?", answer: "No. The current workflow prepares private, editable exports so you can approve every cut before publishing." },
      { question: "Does AI permanently cut the original video?", answer: "No. Analysis produces suggestions. Your source remains private and your trim, caption, crop, and audio decisions stay editable." },
      { question: "Which short-form formats are supported?", answer: "Projects can be prepared for vertical 9:16, square 1:1, and landscape 16:9 outputs used across TikTok, Reels, Shorts, Facebook, and YouTube." },
      { question: "Can I choose the analysis model?", answer: "Yes. Use Editor Autopilot or an approved GPT, Gemini, or local analysis option before running analysis." },
    ],
  },
] as const;

export const comparisonPages = [
  {
    slug: "editing-app-vs-veed",
    competitor: "VEED",
    competitorUrl: "https://www.veed.io/tools/video-editor",
    seoTitle: "Editing App vs VEED: AI Video Tools",
    title: "Editing App vs VEED: AI video creation and editing compared",
    description: "Compare Editing App and VEED for AI video generation, browser editing, model choice, product ads, background processing, and publishing workflows.",
    summary: "VEED is a mature all-in-one editor with collaboration, avatars, translation, and a broad publishing workflow. Editing App is the more focused choice when explicit model selection, private generation delivery, source-aware product ads, and visible model limits matter most.",
    editingAppBestFor: "Creators and agencies that want explicit model choice, private jobs, capability-aware routing, and one workflow for editing, generation, images, ads, and cutouts.",
    competitorBestFor: "Teams that prioritize a mature browser editor, collaboration, avatars, translation, stock media, and broad publishing features.",
    rows: [
      { criterion: "AI video models", editingApp: "Selectable Seedance, LTX, Veo, and Kling routes plus compatibility-aware Autopilot", competitor: "Multiple leading AI models inside a broad video suite" },
      { criterion: "Long-video editing", editingApp: "Selectable analysis models with editable scene, transcript, silence, and highlight suggestions", competitor: "Text-based editing, Auto Edits, captions, cleanup, and B-roll tools" },
      { criterion: "Product URL ads", editingApp: "Source-aware workflow with claim guardrails and platform controls", competitor: "General AI generation and marketing-video workflows" },
      { criterion: "Delivery architecture", editingApp: "Durable background jobs, private storage, and paid-render delivery checkpoints", competitor: "Cloud editor and team workspace" },
      { criterion: "Best-known strength", editingApp: "Transparent model choice and specialized creative routing", competitor: "Breadth, collaboration, translation, avatars, and publishing" },
    ],
  },
  {
    slug: "editing-app-vs-creatify",
    competitor: "Creatify",
    competitorUrl: "https://creatify.ai/features",
    seoTitle: "Editing App vs Creatify: AI Ad Tools",
    title: "Editing App vs Creatify: product URL video ads compared",
    description: "Compare Editing App and Creatify for product URL ads, ecommerce creative, AI avatars, model choice, long-video editing, and source-aware generation.",
    summary: "Creatify specializes in scalable performance ads, avatars, voices, and creative intelligence. Editing App combines product-URL creative with long-video editing, multi-model video and image generation, private processing, and explicit provider controls.",
    editingAppBestFor: "Small brands and agencies that want product ads plus hands-on editing, model selection, image generation, background removal, and private media jobs in one workspace.",
    competitorBestFor: "Advertisers that prioritize high-volume avatar-led UGC workflows, voice libraries, batch production, and competitor-ad intelligence.",
    rows: [
      { criterion: "Product URL workflow", editingApp: "Extracts source context and blocks unsupported product claims", competitor: "Flagship URL-to-video workflow for marketing ads" },
      { criterion: "Video model control", editingApp: "Named Seedance and Veo ad directors with visible capability limits", competitor: "Outcome-led generation workflow with less emphasis on provider selection" },
      { criterion: "AI avatars and voices", editingApp: "Not a current core feature", competitor: "Custom avatars, AI influencers, AI humans, and a large voice library" },
      { criterion: "Long-video editing", editingApp: "Scene, transcript, silence, highlight, caption, crop, and audio workflow", competitor: "Primarily performance-ad production and editing" },
      { criterion: "Private processing", editingApp: "Private storage, signed delivery URLs, and durable jobs", competitor: "Cloud performance-creative platform" },
    ],
  },
  {
    slug: "editing-app-vs-opusclip",
    competitor: "OpusClip",
    competitorUrl: "https://www.opus.pro/",
    seoTitle: "Editing App vs OpusClip: Video Clipping",
    title: "Editing App vs OpusClip: long video to shorts compared",
    description: "Compare Editing App and OpusClip for turning long videos into shorts, highlight discovery, captions, reframing, model selection, editing, and publishing.",
    summary: "OpusClip is a specialist in automatic clipping and one-click social publishing. Editing App keeps the cut editable and extends the same workspace into premium video generation, image generation, product ads, and background removal.",
    editingAppBestFor: "Editors and agencies that want AI suggestions with timeline control, selectable analysis, private projects, and adjacent generation tools.",
    competitorBestFor: "High-volume creators who prioritize automatic clipping, virality scoring, supported-link ingestion, and direct social publishing.",
    rows: [
      { criterion: "Highlight discovery", editingApp: "Selectable analysis agents produce editable scene and highlight suggestions", competitor: "Specialized automatic clipping and virality-focused ranking" },
      { criterion: "Editorial control", editingApp: "Transcript, captions, crop, cleanup, and timeline decisions remain editable", competitor: "Automation-first clip workflow with an integrated editor" },
      { criterion: "Publishing", editingApp: "Exports private masters for manual approval and publishing", competitor: "One-click publishing to supported social platforms" },
      { criterion: "Generative media", editingApp: "Video, image, product-ad, and background-removal model menus", competitor: "Long-video repurposing is the central product" },
      { criterion: "Best-known strength", editingApp: "One private edit-and-generate workspace", competitor: "Fast, high-volume long-video repurposing" },
    ],
  },
] as const;

export type SearchIntentPage = (typeof searchIntentPages)[number];
export type ComparisonPage = (typeof comparisonPages)[number];

export function getSearchIntentPage(slug: string) {
  return searchIntentPages.find((page) => page.slug === slug);
}

export function getComparisonPage(slug: string) {
  return comparisonPages.find((page) => page.slug === slug);
}
