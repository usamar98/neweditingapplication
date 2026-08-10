export const marketingFeatures = [
  {
    slug: "ai-video-editor",
    eyebrow: "AI-assisted editing",
    seoTitle: "AI Video Editor for Long Videos",
    title: "AI video editor for long footage and precise final cuts",
    description: "Upload long footage, select an AI analysis model, and turn scenes, speech, silences, highlights, captions, crops, and audio cleanup into an editable project.",
    benefits: ["Selectable AI analysis models", "Scene, silence, filler, and highlight suggestions", "Editable captions and transcript navigation", "9:16, 1:1, and 16:9 exports", "Durable background processing for large uploads"],
    workflow: ["Upload with resumable transfer", "Choose Editor Autopilot or a specific analysis model", "Review AI suggestions on the timeline", "Export a private MP4 master"],
    faq: [
      { question: "Does the AI make permanent cuts?", answer: "No. Analysis creates suggestions; trim, cleanup, captions, framing, and audio controls remain editable before export." },
      { question: "Can I choose the analysis model?", answer: "Yes. Use Editor Autopilot or select an approved GPT, Gemini, or local analysis option before re-analysis." },
      { question: "What kinds of long videos can I edit?", answer: "The workflow is designed for interviews, podcasts, webinars, tutorials, product demos, and campaign footage that benefit from transcript and scene analysis." },
      { question: "Can I prepare vertical social clips?", answer: "Yes. Review the AI suggestions, then prepare editable 9:16, 1:1, or 16:9 outputs for Shorts, Reels, TikTok, Facebook, or YouTube." },
    ],
  },
  {
    slug: "ai-video-generator",
    eyebrow: "Multi-model video generation",
    seoTitle: "AI Video Generator with Premium Models",
    title: "AI video generation with the right model for every shot",
    description: "Direct camera movement, mood, aspect ratio, duration, native audio, and resolution, then choose Seedance, LTX, Veo, Kling, or let Model Autopilot route the brief.",
    benefits: ["Seedance 2.5 shots up to 30 seconds at supported resolution", "Native 4K with supported LTX 2.3 Pro and Veo workflows", "Native audio on compatible models", "Server-side capability validation before paid generation", "Private delivery checkpoints prevent duplicate paid renders on retry"],
    workflow: ["Write a production brief", "Choose a model or routing intent", "Select only compatible duration and resolution controls", "Download the private master"],
    faq: [
      { question: "Does every model support 4K and 30 seconds?", answer: "No. Controls adapt to the selected model. Seedance supports longer shots at its available resolution, while supported LTX and Veo routes provide native 4K for shorter clips." },
      { question: "What does Model Autopilot do?", answer: "It ranks approved models by quality, reliability, speed, and cost, then selects only from models compatible with the requested duration and resolution." },
      { question: "Can AI video include generated audio?", answer: "Yes, when the selected provider supports native audio. The interface exposes audio only for compatible models and validates the request again on the server." },
      { question: "How does Editing App avoid duplicate paid renders?", answer: "Durable job checkpoints record the provider request and delivered output so a delivery retry does not silently start the same paid generation again." },
    ],
  },
  {
    slug: "ai-image-generator",
    eyebrow: "Campaign-ready image generation",
    seoTitle: "AI Image Generator with Premium Models",
    title: "AI image generator with art direction and premium model choice",
    description: "Create product, editorial, photoreal, cinematic, and illustrated visuals with Seedream, Recraft, Nano Banana, and FLUX models in one controlled workflow.",
    benefits: ["Seedream 5.0 Pro and Lite", "Recraft V4.1 Pro for brand design", "Nano Banana 2 for instruction fidelity", "FLUX.2 Max and Turbo", "Canvas, art direction, seed, and routing controls"],
    workflow: ["Describe the visual outcome", "Choose an image model or Autopilot", "Set art direction and canvas", "Review the routed private result"],
    faq: [
      { question: "Can I choose a specific image model?", answer: "Yes. Every listed model is allowlisted on the server, or you can use Image Autopilot for a fresh routing decision." },
      { question: "Are generated images public?", answer: "No. Inputs and completed outputs use private storage with time-limited access links." },
      { question: "Which model is best for product and brand graphics?", answer: "Recraft V4.1 Pro is positioned for controlled commercial and brand design, while Seedream, Nano Banana, and FLUX routes cover photoreal, instruction-led, and rapid exploration workflows." },
      { question: "Can I control the canvas and creative direction?", answer: "Yes. The generation brief includes canvas, style, seed, and art-direction controls instead of relying on a single unexplained prompt box." },
    ],
  },
  {
    slug: "performance-creative-studio",
    eyebrow: "Performance creative",
    seoTitle: "AI Ad Creative Studio for Ecommerce",
    title: "Turn product URLs and long videos into platform-ready ad creative",
    description: "Build source-aware ads and short-form content for Facebook, Instagram, TikTok, and YouTube without inventing unsupported product claims.",
    benefits: ["Product URL metadata and image extraction", "Seedance 2.5 and Veo product-ad directors", "Long-video hook discovery", "Platform-aware aspect ratios and calls to action", "Paid-render checkpoints for safe delivery retries"],
    workflow: ["Add a product URL or ready video project", "Choose the target platform", "Set audience, message, and CTA", "Generate or render the platform master"],
    faq: [
      { question: "Which platforms are supported?", answer: "Facebook, Instagram, TikTok, and YouTube are available with platform-aware placements and aspect ratios." },
      { question: "Will it invent product claims?", answer: "The planning prompt explicitly treats the source as data and blocks unsupported prices, discounts, reviews, guarantees, ingredients, and performance claims." },
      { question: "Can I turn a product URL directly into an ad brief?", answer: "Yes. The studio collects available product-page context and media, then combines it with your audience, platform, message, and CTA controls." },
      { question: "Can I reuse a long video instead of a product page?", answer: "Yes. A long-video scout can identify promising hooks in an owned project and prepare a short-form creative direction for the selected platform." },
    ],
  },
  {
    slug: "background-remover",
    eyebrow: "Precision cutouts",
    seoTitle: "AI Background Remover for Products",
    title: "AI background remover for people, products, and fine edges",
    description: "Remove image backgrounds with precision or speed agents, private uploads, transparent PNG output, and edge-aware model routing.",
    benefits: ["BiRefNet V2 precision matting", "Fast Rembg option", "Hair and soft-edge preservation", "Transparent PNG delivery", "Private source and output storage"],
    workflow: ["Upload a JPEG, PNG, or WebP", "Choose precision, speed, or Autopilot", "Run the private cutout job", "Download the transparent PNG"],
    faq: [
      { question: "Which model should I choose?", answer: "Use BiRefNet V2 for hair, products, and fine edges; use Rembg Fast for clean, simple subjects; or let Autopilot decide." },
      { question: "What output format is delivered?", answer: "The completed cutout is stored privately and delivered as a transparent PNG." },
      { question: "Which image formats can I upload?", answer: "The background-removal workflow accepts JPEG, PNG, and WebP source images after server-side validation." },
      { question: "Are the original and cutout images public?", answer: "No. Source files and completed results stay in private storage and are accessed through short-lived signed links." },
    ],
  },
] as const;

export type MarketingFeature = (typeof marketingFeatures)[number];

export function getMarketingFeature(slug: string) {
  return marketingFeatures.find((feature) => feature.slug === slug);
}
