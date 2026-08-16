import type { StaticImageData } from "next/image";
import automotiveCampaign from "@/assets/showcase/automotive-campaign.jpg";
import creativeWorkspace from "@/assets/showcase/creative-workspace.jpg";
import digitalFalcon from "@/assets/showcase/digital-falcon.jpg";
import foodCampaign from "@/assets/showcase/food-campaign.jpg";
import productPhotography from "@/assets/showcase/product-photography.jpg";
import brandPortrait from "@/assets/showcase/brand-portrait.jpg";

export type BlogLink = {
  href: string;
  label: string;
};

export type BlogSection = {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly { title: string; detail: string }[];
  note?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  modifiedAt: string;
  readingTime: string;
  keywords: readonly string[];
  cover: StaticImageData;
  coverAlt: string;
  quickAnswer: string;
  takeaways: readonly string[];
  sections: readonly BlogSection[];
  faqs: readonly { question: string; answer: string }[];
  primaryCta: BlogLink;
  relatedLinks: readonly BlogLink[];
};

export const blogPosts: readonly BlogPost[] = [
  {
    slug: "ai-video-prompt-guide",
    title: "The AI Video Prompt Guide: Camera, Motion, Audio, and Continuity",
    seoTitle: "AI Video Prompt Guide: Camera, Motion & Audio",
    description: "Write stronger AI video prompts with a practical shot brief for subject, action, camera, light, sound, continuity, duration, and format.",
    excerpt: "A production-minded framework for turning an idea into a controllable AI video shot—without stuffing the prompt with conflicting instructions.",
    category: "AI video",
    publishedAt: "2026-08-17",
    modifiedAt: "2026-08-17",
    readingTime: "9 min read",
    keywords: ["AI video prompt", "AI video generator", "text to video prompt", "AI video camera prompt", "Seedance prompt", "Veo prompt", "Kling prompt"],
    cover: automotiveCampaign,
    coverAlt: "Cinematic black sports car moving along a coastal road at sunset",
    quickAnswer: "A useful AI video prompt behaves like a one-shot production brief: identify the subject, describe one clear action, define the camera, set the environment and light, specify sound only when supported, and finish with duration and aspect ratio. Give the model one visual priority instead of a pile of competing adjectives.",
    takeaways: [
      "Start with the action viewers must understand, then add style.",
      "Describe camera movement and subject movement separately.",
      "Use image-to-video when product identity or character consistency matters.",
      "Choose a model only after duration, resolution, and audio requirements are clear.",
    ],
    sections: [
      {
        heading: "Why most AI video prompts fail",
        paragraphs: [
          "Weak prompts usually fail for one of two reasons: they are too vague to direct the shot, or they contain so many instructions that the model cannot tell what matters. “Make a cinematic product video” leaves the subject, action, lens, framing, timing, and sound undefined. The opposite—a paragraph containing six camera moves, three locations, and several visual styles—creates conflicts.",
          "Treat a generation as a short shot, not an entire campaign. A single shot needs one subject, one main action, and one camera idea. If your concept needs an establishing shot, a close-up, and a final offer frame, generate those as separate assets and edit them together. That gives you more control and makes failed iterations cheaper to diagnose.",
        ],
        note: "Editorial rule: if you cannot sketch the shot as one panel of a storyboard, the prompt is probably trying to do too much.",
      },
      {
        heading: "Use a seven-part shot brief",
        paragraphs: [
          "A reliable prompt can be assembled in a fixed order. The order is not magic; its value is that it forces you to make the important production decisions before generation. Keep every part concrete and remove any detail that does not change the final frame.",
        ],
        bullets: [
          { title: "Subject", detail: "Name the person, product, place, or object and the visual details that must remain recognizable." },
          { title: "Action", detail: "Describe one observable movement: turns, pours, opens, drives, looks up, or moves through frame." },
          { title: "Camera", detail: "Choose framing and one move, such as a low-angle tracking shot, locked macro close-up, or slow dolly in." },
          { title: "Environment", detail: "Define the location, time, weather, foreground, and background only as needed." },
          { title: "Light and texture", detail: "State the light source and material response: soft window light, wet reflections, brushed metal, or translucent glass." },
          { title: "Sound", detail: "When the selected model supports native audio, describe the important ambient sound, effect, music mood, or short spoken line." },
          { title: "Delivery", detail: "Choose duration, resolution, and aspect ratio for the destination before selecting a model." },
        ],
      },
      {
        heading: "Separate camera motion from subject motion",
        paragraphs: [
          "“Dynamic movement” is not a camera direction. Tell the model what moves and what remains stable. For example: “The bottle stays centered while the camera makes a slow 30-degree orbit; condensation moves down the glass.” That sentence gives the model two independent motion relationships and a clear anchor.",
          "Use familiar production language where it adds precision: locked-off, handheld, tracking, dolly in, orbit, crane up, rack focus, macro, wide establishing shot, or over-the-shoulder. Avoid combining moves that fight each other. A fast whip pan, slow dolly, aerial orbit, and macro close-up do not belong in the same five-second shot.",
        ],
      },
      {
        heading: "Match the model to the delivery requirement",
        paragraphs: [
          "Model choice should follow the brief. A longer social narrative, a short native-audio shot, a 4K master, and a fast concept test are different jobs. Editing App filters combinations by supported duration and resolution, then lets Video Autopilot choose among compatible models or lets a subscribed user select a model directly.",
          "Seedance, Veo, LTX, and Kling each expose different duration, resolution, speed, and audio options in the workspace. Those capabilities can change as providers update their endpoints, so confirm the currently displayed options before promising a format to a client.",
        ],
        bullets: [
          { title: "Longer single shot", detail: "Prioritize a model that supports the requested length without pretending multiple generated clips are one continuous take." },
          { title: "Native sound", detail: "Choose a native-audio model and describe only the sound that affects the scene." },
          { title: "Identity-sensitive product", detail: "Start from an approved reference image and use an image-to-video workflow." },
          { title: "Rapid testing", detail: "Use a faster compatible route for hook and movement tests before spending on the final render." },
        ],
      },
      {
        heading: "A prompt template you can reuse",
        paragraphs: [
          "Use this structure: “[Subject with essential identity details] [performs one action]. [Framing and one camera move]. [Environment and time]. [Lighting and material detail]. [Native audio or ambient sound, if needed]. [Duration, aspect ratio, and delivery intent].”",
          "Example: “A matte-black performance car follows a coastal curve at sunset, staying sharp as the road and guardrail streak gently behind it. Low three-quarter tracking shot, camera level with the front wheel, one smooth forward move. Warm rim light on the bodywork, cool ocean reflections, realistic tire motion. Subtle engine note and wind, no dialogue. Eight-second 16:9 premium campaign shot.” The prompt is specific without directing an entire commercial in one generation.",
        ],
      },
      {
        heading: "Review the output like an editor",
        paragraphs: [
          "Do not judge only the prettiest frame. Watch hands, wheels, reflections, typography, product geometry, lip movement, background continuity, and the start and end of the shot. A beautiful middle frame is not enough if the asset cannot survive a full playback.",
          "Change one variable per iteration. If motion is wrong, revise the action or camera sentence—not the lighting, wardrobe, location, and duration at the same time. Controlled iteration creates reusable knowledge for your next prompt and avoids spending credits without learning what fixed the shot.",
        ],
      },
    ],
    faqs: [
      { question: "How long should an AI video prompt be?", answer: "Long enough to define the shot, but short enough to preserve one priority. A compact paragraph covering subject, action, camera, environment, light, sound, and delivery is usually more controllable than a page of creative direction." },
      { question: "Should I include negative prompts?", answer: "Only when the selected model supports them and the exclusion is important. Clear positive direction is usually the first fix. Avoid a long generic list that competes with the actual shot brief." },
      { question: "Is text-to-video or image-to-video better for products?", answer: "Image-to-video is generally the safer starting point when label, packaging, color, or shape must stay recognizable. Text-to-video is useful for concepts where exact product identity is not the central constraint." },
    ],
    primaryCta: { href: "/generate/video", label: "Open the AI video generator" },
    relatedLinks: [
      { href: "/ai-video-models", label: "Compare supported AI video models" },
      { href: "/creative-studio/video", label: "Create a product video ad" },
      { href: "/pricing", label: "See plans and generation credits" },
    ],
  },
  {
    slug: "nano-banana-vs-seedream-vs-flux",
    title: "Nano Banana vs Seedream vs FLUX: Choose by the Image Brief",
    seoTitle: "Nano Banana vs Seedream vs FLUX Image Guide",
    description: "Compare Nano Banana, Seedream, FLUX, and Recraft by prompt fidelity, photorealism, typography, brand layout, speed, and image workflow.",
    excerpt: "There is no universal best image model. This decision guide starts with the asset you need and the failure you cannot accept.",
    category: "AI images",
    publishedAt: "2026-08-17",
    modifiedAt: "2026-08-17",
    readingTime: "8 min read",
    keywords: ["Nano Banana vs Seedream", "Nano Banana 2", "Seedream 5", "FLUX 2", "best AI image generator", "AI image model comparison", "Recraft"],
    cover: digitalFalcon,
    coverAlt: "Detailed blue digital falcon surrounded by glowing particles and circuitry",
    quickAnswer: "Choose the model by the job: use a prompt-faithful route for precise instructions, a photoreal route for materials and campaign imagery, a design-led route for layouts, and a fast route for early exploration. Test the same brief across two compatible models when the asset is commercially important.",
    takeaways: [
      "The best model depends on whether accuracy, realism, design, or speed is the priority.",
      "A shared test brief is more useful than comparing unrelated showcase images.",
      "Text inside an image must still be proofread before publication.",
      "Save the prompt, aspect ratio, seed, and selected output—not only the final file.",
    ],
    sections: [
      {
        heading: "Stop asking which model wins everything",
        paragraphs: [
          "Image-model comparisons often rank dramatic showcase pictures while ignoring the business brief. An ecommerce hero image, a local-service ad, a branded infographic, and a fantasy concept do not fail in the same way. The right question is: which error would make this asset unusable?",
          "For a package shot, a changed logo or product shape is the critical failure. For a social graphic, weak composition or unreadable text may matter more. For ideation, speed and variety can outrank final-detail quality. Define that constraint before choosing Nano Banana, Seedream, FLUX, Recraft, or Image Autopilot.",
        ],
      },
      {
        heading: "A practical role for each model family",
        paragraphs: [
          "Editing App presents models as agents with a production role instead of an unexplained list. The labels below describe how the current workspace routes briefs; model providers can update capabilities, pricing, and endpoints over time.",
        ],
        bullets: [
          { title: "Nano Banana 2", detail: "Use when detailed instruction following and controlled transformation are central to the brief." },
          { title: "Seedream 5", detail: "Use for premium campaign composition, prompt understanding, and typography-aware concepts." },
          { title: "FLUX.2 Max", detail: "Use for photoreal materials, lighting, and polished campaign imagery." },
          { title: "Recraft V4.1 Pro", detail: "Use for brand graphics, product layouts, and design-led commercial art direction." },
          { title: "Fast routes", detail: "Use Seedream Lite or FLUX Turbo to explore compositions before choosing the final production route." },
        ],
      },
      {
        heading: "Run a fair model test",
        paragraphs: [
          "Use the same objective, reference image, aspect ratio, and essential constraints for every candidate. Do not give one model a carefully written brief and another a vague sentence. Generate enough variants to see a pattern, but set a budget before testing.",
          "Score outputs against a small rubric: subject accuracy, composition, text accuracy, material realism, brand fit, and amount of manual repair. The winner is the model that delivers the most usable asset with the fewest expensive revisions—not necessarily the image with the most dramatic first impression.",
        ],
        bullets: [
          { title: "Accuracy", detail: "Did identity, color, product geometry, and required objects survive?" },
          { title: "Composition", detail: "Is there deliberate space for copy, a clear focal point, and the right crop?" },
          { title: "Commercial finish", detail: "Do light, shadow, texture, and scale look plausible for the channel?" },
          { title: "Repair cost", detail: "How much retouching, regeneration, or layout work remains?" },
        ],
      },
      {
        heading: "Write the brief around the asset",
        paragraphs: [
          "A strong prompt names the asset type and destination before describing style. “Instagram portrait ad for a neighborhood coffee shop” creates a more useful frame than “beautiful coffee image.” Add audience, offer, focal subject, environment, light, brand colors, copy-safe area, and anything that must not change.",
          "For product work, separate factual constraints from art direction. First list the exact packaging, shape, color, and visible label requirements. Then describe the scene. This makes it easier to identify whether a failure came from identity handling or from the visual concept itself.",
        ],
      },
      {
        heading: "Treat generated typography as a draft",
        paragraphs: [
          "Image models have improved at placing words, but generated text still needs human review. Verify spelling, price, dates, disclaimers, brand names, and calls to action. Never let a visually convincing render become the source of truth for an offer.",
          "For high-risk copy, generate the visual with a deliberate text-safe region and place the final text in a layout tool. For fast social concepts, generation can produce the composition, but the approved wording should still be checked against the product page or business brief before the ad goes live.",
        ],
      },
      {
        heading: "Build a repeatable image system",
        paragraphs: [
          "Store the brief, reference, model, aspect ratio, seed when available, and approval status with each result. A reusable production recipe is more valuable than a folder of disconnected images. It also makes it easier to produce seasonal variants without accidentally changing the brand or product.",
          "Use Autopilot when you want the workspace to balance quality, speed, and cost among compatible routes. Select a model directly when you are intentionally comparing outputs or repeating a tested recipe. Direct model selection is a creative decision, not a guarantee that every prompt will succeed on the first attempt.",
        ],
      },
    ],
    faqs: [
      { question: "Is Nano Banana better than FLUX?", answer: "Not for every brief. Nano Banana may be the better fit for instruction-sensitive work, while a FLUX route may be preferred for photoreal materials and campaign imagery. Test against the error that matters to your asset." },
      { question: "Which AI image model is best for text?", answer: "Typography-aware models can create useful text-led concepts, but every word, number, and legal line still needs review. For exact final copy, reserve space and add approved text separately." },
      { question: "Why does the same prompt look different across models?", answer: "Models interpret composition, language, style, references, and sampling differently. That is why a consistent rubric and controlled test are more useful than expecting identical outputs." },
    ],
    primaryCta: { href: "/generate/image", label: "Compare models in the image studio" },
    relatedLinks: [
      { href: "/creative-studio/image", label: "Build a platform-ready image ad" },
      { href: "/remove-background", label: "Prepare a transparent product cutout" },
      { href: "/features", label: "Explore every creative workflow" },
    ],
  },
  {
    slug: "remove-background-from-product-photo",
    title: "How to Remove a Product Photo Background Without Ruining the Edges",
    seoTitle: "Remove a Product Photo Background Cleanly",
    description: "Remove product photo backgrounds cleanly with better source images, precise edge review, realistic shadows, transparent PNG export, and marketplace-ready QA.",
    excerpt: "The cutout is only half the job. Learn how to protect fine edges, preserve product identity, and make the subject belong in its new scene.",
    category: "Background removal",
    publishedAt: "2026-08-17",
    modifiedAt: "2026-08-17",
    readingTime: "8 min read",
    keywords: ["background remover", "remove background from product photo", "transparent product image", "product photo background removal", "PNG background remover"],
    cover: productPhotography,
    coverAlt: "Luxury amber perfume bottle with reflective glass and dramatic mist",
    quickAnswer: "Start with a sharp, well-separated product photo, use a precision matting model for reflective or detailed subjects, inspect the mask at full size, and export a transparent PNG. When placing the cutout into a new scene, match light direction, contact shadow, color temperature, and scale so it does not look pasted on.",
    takeaways: [
      "A better source photo improves the mask more than aggressive cleanup later.",
      "Transparent, reflective, hairy, and motion-blurred edges need precision matting.",
      "Review the alpha edge on both light and dark backgrounds.",
      "A realistic contact shadow matters as much as the cutout itself.",
    ],
    sections: [
      {
        heading: "Choose a source image the model can separate",
        paragraphs: [
          "Background removal is an edge-classification problem. If the product and background share the same color, the subject is motion-blurred, or the image is heavily compressed, even a strong model has less evidence to work with. Use the highest-resolution original available and avoid screenshots when the source file exists.",
          "Create visual separation during capture: move the product away from the wall, use a background that contrasts with the outer edge, keep the full subject inside the frame, and focus on the label or most important surface. For glass, jewelry, hair, fur, and mesh, preserve detail rather than increasing contrast until the edge clips.",
        ],
      },
      {
        heading: "Use fast removal and precision matting for different jobs",
        paragraphs: [
          "A simple object on a clean background does not always need the most expensive route. A fast remover can be ideal for high-volume catalog preparation. Complex subjects—hair, translucent fabric, glass, fine product parts, or a busy background—benefit from a precision matting model.",
          "Editing App exposes Rembg Fast for economical simple cutouts and BiRefNet V2 for fine-edge work, with Cutout Autopilot available to route the job. The selected model should match the edge difficulty, not the perceived importance of the product.",
        ],
      },
      {
        heading: "Inspect the alpha mask, not just the preview",
        paragraphs: [
          "A checkerboard preview can hide halos and missing detail. Download or inspect the full-size transparent PNG against white, black, and a saturated color. Light fringes become visible on dark backgrounds; dark contamination appears on light backgrounds.",
          "Zoom into corners, handles, hair, straps, holes, reflective rims, and contact points. Watch for three common defects: a hard cut that removes soft edge pixels, a colored halo inherited from the old background, and semi-transparent areas that become muddy over a new image.",
        ],
        bullets: [
          { title: "Outer contour", detail: "Check for bites, flat spots, and leftover background fragments." },
          { title: "Interior holes", detail: "Inspect handles, spokes, gaps, and negative space inside the subject." },
          { title: "Soft detail", detail: "Preserve hair, fur, fibers, mist, and naturally translucent material." },
          { title: "Product truth", detail: "Confirm the label, shape, color, and included accessories were not altered." },
        ],
      },
      {
        heading: "Make the product belong in the new background",
        paragraphs: [
          "A technically clean cutout can still look artificial. Match the direction and softness of light in the product photo to the destination scene. A subject lit from the left will look wrong on a background whose strongest light comes from the right. Match color temperature as well: warm sunset light and cool studio light should not be combined without correction.",
          "Add a contact shadow where the product meets the surface. The shadow should follow the scene's light direction, grow softer with distance, and use the correct opacity. Also check perspective and scale. A perfect mask cannot fix a product that floats, leans against the wrong horizon, or is implausibly large.",
        ],
      },
      {
        heading: "Export the right file for each channel",
        paragraphs: [
          "Use PNG when transparency must be preserved. JPEG does not contain an alpha channel and will flatten the image onto a background. Keep a high-resolution transparent master, then create channel-specific derivatives rather than repeatedly editing a small marketplace file.",
          "For a white-background listing, place the approved transparent master over true white and export to the marketplace's required dimensions and format. For paid social, keep more breathing room so the product survives platform crops. Always verify each marketplace's current image rules before publishing.",
        ],
      },
      {
        heading: "A five-minute quality checklist",
        paragraphs: [
          "Before approving a batch, compare the cutout with the original and check identity, edge quality, internal holes, transparency, shadow, scale, and export size. Spot-check at full resolution rather than trusting thumbnail grids.",
          "For commercial work, keep the original, transparent master, and final composite as separate files. That small asset discipline prevents accidental quality loss and makes future campaign variations much faster.",
        ],
      },
    ],
    faqs: [
      { question: "What file type keeps a background transparent?", answer: "PNG is the usual choice for transparent product cutouts because it supports an alpha channel. JPEG does not preserve transparency." },
      { question: "Why is there a white outline around my cutout?", answer: "The edge may contain pixels blended with the original light background. Review the alpha mask on a dark color and use a precision matting workflow for complex or semi-transparent edges." },
      { question: "Can a background remover handle glass?", answer: "It can, but glass and other translucent products are difficult because the background is visible through the subject. Start with a clean high-resolution source and review the full-size result on multiple backgrounds." },
    ],
    primaryCta: { href: "/remove-background", label: "Remove a background now" },
    relatedLinks: [
      { href: "/creative-studio/image", label: "Turn the cutout into an image ad" },
      { href: "/generate/image", label: "Create a new campaign background" },
      { href: "/pricing", label: "Compare plans and credits" },
    ],
  },
  {
    slug: "turn-long-video-into-youtube-shorts",
    title: "How to Turn a Long Video into YouTube Shorts, Reels, and TikToks",
    seoTitle: "Turn Long Videos into YouTube Shorts & Reels",
    description: "Turn a long video into strong YouTube Shorts, Instagram Reels, and TikToks with better moment selection, hooks, captions, reframing, and platform QA.",
    excerpt: "A repeatable short-form workflow for finding self-contained moments—not randomly chopping a long recording into vertical fragments.",
    category: "AI clipping",
    publishedAt: "2026-08-17",
    modifiedAt: "2026-08-17",
    readingTime: "10 min read",
    keywords: ["turn long video into YouTube Shorts", "long video to shorts", "AI clipper", "video clipper", "YouTube Shorts maker", "podcast to reels", "TikTok clips"],
    cover: creativeWorkspace,
    coverAlt: "Creator working with video editing and social analytics screens",
    quickAnswer: "Transcribe the long video, rank moments that make sense without missing context, open each clip with its strongest line, remove dead air, reframe for the target platform, add readable captions, and export one clean master per aspect ratio. A good short delivers one complete promise rather than summarizing the whole recording.",
    takeaways: [
      "Select self-contained moments with a hook, payoff, and clear context.",
      "Start the clip at the first useful word, not the original edit point.",
      "Reframe intentionally; do not simply crop the center of a wide video.",
      "Judge retention and business value separately when prioritizing clips.",
    ],
    sections: [
      {
        heading: "A short is not a smaller long-form video",
        paragraphs: [
          "Long-form viewers accept setup because they chose the full conversation, tutorial, webinar, or interview. Short-form viewers meet the clip with almost no context. The edit has to establish a reason to keep watching immediately and still deliver a complete idea.",
          "Do not cut every sixty seconds or select only the loudest sentence. Look for a moment with a clear tension, question, claim, demonstration, transformation, or surprising detail. The clip should be understandable to someone who has never seen the source.",
        ],
      },
      {
        heading: "Transcribe first, then rank moments",
        paragraphs: [
          "A transcript makes the source searchable and reveals where the speaker changes topic, repeats an idea, or lands a useful line. Scene changes and audio cues add another layer, but words usually provide the fastest way to screen a long recording at scale.",
          "Editing App's AI Clipper combines transcript, scene, and highlight analysis, then presents candidate moments for review. AI ranking is a starting point, not editorial approval. Listen to the lead-in and the sentence after the proposed endpoint before deciding whether the moment is complete.",
        ],
        bullets: [
          { title: "Hook", detail: "Can the first line create curiosity or state a clear benefit without clickbait?" },
          { title: "Context", detail: "Can a new viewer understand who, what, and why?" },
          { title: "Payoff", detail: "Does the clip answer the question or complete the promised idea?" },
          { title: "Visual support", detail: "Is there enough movement, expression, demonstration, or B-roll opportunity?" },
          { title: "Brand value", detail: "Does the moment attract the audience you actually want?" },
        ],
      },
      {
        heading: "Move the strongest line to the front—carefully",
        paragraphs: [
          "Many strong moments contain a useful sentence after several seconds of throat-clearing. Remove greetings, repeated setup, filler, and references that only make sense in the full episode. If needed, use a short on-screen context line, but do not rewrite a speaker's meaning.",
          "A cold open can preview the payoff, followed by a quick return to the essential setup. Use this pattern only when the edit remains truthful. Misleading cuts may produce a temporary spike, but they damage audience trust and can create approval problems for clients and guests.",
        ],
      },
      {
        heading: "Reframe for people, products, and demonstrations",
        paragraphs: [
          "A centered 9:16 crop works only when the important subject remains in the center. Interviews may need speaker tracking or a split layout. Screen recordings need a zoomed detail rather than the entire desktop. Product demonstrations need enough space for hands, the product, and captions.",
          "Build separate crops for 9:16, 1:1, and 16:9 when the channel needs them. Keep faces and essential text away from interface overlays. Platform safe areas change, so preview the exported asset in the current publishing interface before scheduling a campaign.",
        ],
      },
      {
        heading: "Make captions readable, not decorative",
        paragraphs: [
          "Captions should help viewers follow the idea with sound off. Use accurate timing, a readable size, high contrast, and short line lengths. Correct names, product terms, numbers, and industry vocabulary manually; automated transcription is not final copy.",
          "Highlighting every word creates visual noise. Use emphasis for the important phrase and let the rest of the caption remain stable. Keep text away from faces, products, and platform controls. Burned-in captions are useful for consistent appearance, while a separate caption file can improve accessibility where supported.",
        ],
      },
      {
        heading: "Package and measure each clip",
        paragraphs: [
          "Write a title and description around the exact idea in the clip, not the broad topic of the full video. Create a clear cover frame where the platform uses one. Link to the full source only when the short genuinely creates interest in a deeper explanation.",
          "Measure the first-seconds hold, average percentage viewed, rewatches, saves, qualified comments, clicks, and conversions. A clip with fewer views can be more valuable if it attracts the right buyer. Feed the best-performing hook structures and topics back into future recording plans.",
        ],
      },
    ],
    faqs: [
      { question: "How many Shorts can I make from one long video?", answer: "There is no fixed number. Publish only self-contained moments that offer a clear hook and payoff. A focused interview may yield several strong clips; a repetitive recording may produce only one." },
      { question: "Should the same clip be posted to Shorts, Reels, and TikTok?", answer: "A shared clean master can work, but review crop, caption safe areas, title, cover, music rights, and platform context separately. Avoid exporting one platform's watermark into another." },
      { question: "Can AI choose the best moments automatically?", answer: "AI can transcribe, detect scenes, and rank likely highlights, which saves screening time. A person should still verify context, accuracy, pacing, rights, and brand fit before publishing." },
    ],
    primaryCta: { href: "/clipper", label: "Find clips with AI Clipper" },
    relatedLinks: [
      { href: "/tools/long-video-to-shorts", label: "Explore the long-video-to-shorts workflow" },
      { href: "/features", label: "See all creative features" },
      { href: "/pricing", label: "Compare clipping and generation plans" },
    ],
  },
  {
    slug: "ai-product-photography-ecommerce",
    title: "AI Product Photography for Ecommerce: A Practical Creative Workflow",
    seoTitle: "AI Product Photography for Ecommerce: Guide",
    description: "Plan AI product photography for ecommerce with accurate references, listing shots, lifestyle scenes, prompt briefs, channel crops, and commercial QA.",
    excerpt: "Use AI to expand a real product asset into useful listing, lifestyle, and campaign images while protecting the details customers rely on.",
    category: "Ecommerce creative",
    publishedAt: "2026-08-17",
    modifiedAt: "2026-08-17",
    readingTime: "10 min read",
    keywords: ["AI product photography", "product photography ecommerce", "AI product photos", "ecommerce product images", "product ad generator", "product photography prompts"],
    cover: foodCampaign,
    coverAlt: "Cinematic ecommerce food campaign featuring a burger and suspended ingredients",
    quickAnswer: "Build AI product photography from an approved reference and a shot list. Create accurate listing images first, then lifestyle context, detail views, seasonal variations, and ad crops. Review shape, color, label, quantity, scale, claims, and shadows before any image reaches a storefront or paid campaign.",
    takeaways: [
      "Start with customer questions and channel requirements, not visual style.",
      "Keep an approved product reference and a factual constraint list.",
      "Separate catalog truth from campaign art direction.",
      "Use a consistent QA checklist across every generated variation.",
    ],
    sections: [
      {
        heading: "Start with the images a buyer needs",
        paragraphs: [
          "A dramatic hero image cannot replace a complete product set. Buyers need to understand the item, scale, material, included parts, use, and important detail before they can trust a listing. Plan the shot list around those questions.",
          "Create the factual images first: clean front view, alternate angles, detail or texture close-up, scale reference, packaging, and what's included. Lifestyle and seasonal images support desire, but they should not hide information the customer needs to evaluate the product.",
        ],
        bullets: [
          { title: "Catalog", detail: "Clear product-first views for product pages and marketplaces." },
          { title: "Detail", detail: "Material, finish, controls, texture, ingredients, or craftsmanship." },
          { title: "Scale", detail: "A truthful reference that helps the buyer understand dimensions." },
          { title: "Lifestyle", detail: "The product used by the intended audience in a believable setting." },
          { title: "Campaign", detail: "A visually distinctive concept with copy-safe areas and channel crops." },
        ],
      },
      {
        heading: "Protect product truth with a reference pack",
        paragraphs: [
          "Collect the highest-quality approved product images, logo files, brand colors, packaging references, dimensions, and a list of details that must not change. Photograph multiple angles when the model needs to understand a distinctive shape. For reflective or transparent items, include a clean reference where the silhouette and label remain readable.",
          "Create a factual constraint block before writing art direction: exact product color, number of items, cap or handle shape, label wording, material, and included accessories. The generated scene can be imaginative; the commercial facts cannot be invented.",
        ],
      },
      {
        heading: "Write prompts like a photography brief",
        paragraphs: [
          "Name the shot type, customer, environment, composition, camera angle, light source, surface, material behavior, palette, and crop. Include the intended channel so the model can reserve space for interface overlays or ad copy.",
          "Example: “Portrait product ad for a premium amber fragrance bottle, exact bottle shape and label preserved from the reference. Bottle upright on dark wet stone, soft warm backlight passing through the liquid, cool low-contrast background, realistic contact reflection, empty upper-right area for approved copy, 4:5 crop.” This brief makes the product constraint separate from the scene direction.",
        ],
      },
      {
        heading: "Choose the model by the shot",
        paragraphs: [
          "Use a reference-aware, instruction-faithful route when product identity is the main risk. Use a photoreal route for material, light, and lifestyle imagery. Use a design-led route for graphic layouts and campaign composition. A fast model is valuable for exploring several directions before a premium final pass.",
          "Do not force one model to produce the full catalog. A clean cutout, a photoreal lifestyle scene, and a text-led sale graphic can use different workflows while still sharing the same approved reference and brand rules.",
        ],
      },
      {
        heading: "Use background removal as a production layer",
        paragraphs: [
          "A high-quality transparent master makes the product reusable across listing backgrounds, campaign scenes, retailer templates, and seasonal layouts. Remove the background from the best approved reference, inspect the edge on light and dark colors, and keep that master separate from final composites.",
          "When placing it into a generated environment, match perspective, light direction, color temperature, contact shadow, reflection, and scale. Otherwise a technically accurate product still looks pasted into the scene.",
        ],
      },
      {
        heading: "Run commercial QA before publishing",
        paragraphs: [
          "Compare every generated asset with the approved product and source page. Check shape, color, logo, label, quantity, included items, dimensions, claims, legal copy, and the apparent use of the product. A polished render can still be commercially wrong.",
          "Review channel crops at their final size and confirm the focal subject, copy-safe area, and mobile legibility. Keep records of the source reference, prompt, model, selected output, and human approval. That audit trail helps teams correct mistakes and repeat successful directions.",
        ],
      },
      {
        heading: "Measure a useful creative system—not image volume",
        paragraphs: [
          "The goal is not to generate the most images. Track how quickly a brief reaches approval, how many outputs need repair, which assets improve click-through or conversion, and whether returns or customer questions reveal a misleading visual.",
          "Build reusable recipes by product category and channel. A documented lighting setup, crop system, prompt structure, and QA list can turn one successful campaign into a repeatable workflow without making every product look identical.",
        ],
      },
    ],
    faqs: [
      { question: "Can AI product photos replace a real photoshoot?", answer: "They can reduce the need for some listing variations, backgrounds, and campaign concepts, but a trustworthy approved product reference is still essential. Complex materials, fit, safety details, or regulated claims may require conventional photography and specialist review." },
      { question: "How do I keep the product accurate?", answer: "Use a high-quality reference pack, isolate the details that must not change, choose a reference-aware workflow, and compare every output against the source before approval." },
      { question: "What product images should an ecommerce page include?", answer: "A useful set typically covers clean product views, alternate angles, detail, scale, packaging or included parts, and believable use. Exact requirements depend on the product and marketplace." },
    ],
    primaryCta: { href: "/generate/image", label: "Create an ecommerce image concept" },
    relatedLinks: [
      { href: "/remove-background", label: "Prepare a transparent product master" },
      { href: "/creative-studio/image", label: "Generate an image ad from a product URL" },
      { href: "/blog/nano-banana-vs-seedream-vs-flux", label: "Choose the right AI image model" },
    ],
  },
  {
    slug: "product-url-to-video-ad",
    title: "How to Turn a Product URL into a Video Ad That Stays On-Brand",
    seoTitle: "Turn a Product URL into a Video Ad",
    description: "Turn a product URL into a video ad with source-grounded facts, a focused hook, an approved storyboard, the right AI model, and platform-specific QA.",
    excerpt: "A source-grounded workflow for moving from a real product page to a short paid-social concept without inventing claims or losing brand identity.",
    category: "AI advertising",
    publishedAt: "2026-08-17",
    modifiedAt: "2026-08-17",
    readingTime: "9 min read",
    keywords: ["product URL to video", "product URL to video ad", "AI video ad generator", "ecommerce video ad", "product page to video", "AI ad creative"],
    cover: brandPortrait,
    coverAlt: "Premium stylized brand portrait in an ornate red and gold jacket",
    quickAnswer: "Extract only verifiable product facts and approved images from the URL, choose one audience and one promise, storyboard a short hook-to-proof-to-action sequence, generate compatible shots, and review every claim, product detail, crop, caption, and sound before launch. The page is a source, not permission to invent missing information.",
    takeaways: [
      "Separate facts from creative interpretation before generating anything.",
      "One ad should communicate one audience problem and one product promise.",
      "Generate shots as controllable units, then assemble the final narrative.",
      "Prepare platform variants from a clean master instead of recycling watermarked exports.",
    ],
    sections: [
      {
        heading: "Treat the product page as a source document",
        paragraphs: [
          "A product URL can provide the title, images, description, price, variants, features, reviews, and brand language. It can also contain stale, ambiguous, or market-specific information. Extract the useful material, then separate verified facts from creative assumptions.",
          "Create a source sheet with the exact product name, approved claim language, visible product attributes, price and currency, offer dates, target market, brand colors, logo, and image references. Mark anything that needs owner approval. Never generate a health, performance, financial, environmental, or comparative claim just because it would make a stronger hook.",
        ],
      },
      {
        heading: "Choose one audience and one job",
        paragraphs: [
          "A short ad cannot sell every feature to every buyer. Pick a specific audience situation and the most relevant verified benefit. The creative can then show the problem, product, proof, and action without becoming a fast-moving list of bullets.",
          "Write a one-sentence strategy: “For [audience] who struggle with [situation], show how [product] delivers [verified benefit], then invite [action].” If the source page does not support the benefit, revise the strategy before producing the ad.",
        ],
      },
      {
        heading: "Storyboard the ad before generating shots",
        paragraphs: [
          "A practical short-form structure is hook, context, product reveal, proof or demonstration, and call to action. Not every ad needs five separate scenes, but every scene should have a role. Sketch the frames and write the approved on-screen copy before choosing a video model.",
        ],
        bullets: [
          { title: "Hook", detail: "Create relevance through a recognizable problem, surprising visual, or specific outcome." },
          { title: "Context", detail: "Give the viewer enough information to understand why the product matters." },
          { title: "Reveal", detail: "Show the real product clearly and preserve its defining details." },
          { title: "Proof", detail: "Use an approved demonstration, feature, review, or factual reason to believe." },
          { title: "Action", detail: "State one honest next step that matches the landing page." },
        ],
      },
      {
        heading: "Use image generation and video generation as separate layers",
        paragraphs: [
          "A source-aware product composite can establish a controlled keyframe. Image-to-video can then animate that approved visual while preserving more identity than a text-only restart. Other scenes—an environment, reaction, or transitional detail—may use text-to-video when exact product fidelity is not required.",
          "Editing App's image ad creator and video ad creator are separate on purpose. Build or approve the static product composition first when accuracy is central, then send the right reference into a compatible motion workflow. This avoids spending premium video credits to solve a layout problem.",
        ],
      },
      {
        heading: "Choose a video route after the storyboard",
        paragraphs: [
          "The storyboard determines whether you need a longer single shot, short native-audio scenes, fast variations, realistic motion, or a high-resolution final. Check duration, resolution, and audio compatibility before generation. A premium model cannot rescue a confused shot brief.",
          "For testing, vary the hook or first visual while keeping the offer and landing page consistent. Change one major element at a time so the performance result teaches you something. Generating many unrelated ads creates volume without a useful experiment.",
        ],
      },
      {
        heading: "Adapt the master for each platform",
        paragraphs: [
          "Create a clean master without another platform's watermark, then prepare the required crops, caption safe areas, cover frames, titles, and calls to action for Facebook, Instagram, TikTok, and YouTube. The same narrative can travel, but the presentation should respect each placement.",
          "Preview on a phone and verify product visibility, subtitle size, sound-off comprehension, offer accuracy, landing-page match, and required disclosures. Platform policies and ad specifications change, so check the current rules before launch rather than treating an old template as permanent.",
        ],
      },
      {
        heading: "Use performance data to improve the next brief",
        paragraphs: [
          "Track hook retention, click-through, landing-page conversion, cost per result, comments, and creative fatigue. Diagnose where the ad fails: weak first frame, unclear product, unbelievable promise, poor landing-page match, or the wrong audience.",
          "Feed that diagnosis back into one stage of the workflow. Better creative operations are a loop: source, strategy, storyboard, generate, approve, distribute, measure, and learn. The goal is not one lucky output; it is a system that produces responsible tests quickly.",
        ],
      },
    ],
    faqs: [
      { question: "Can an AI ad generator copy everything from a product URL?", answer: "It can use accessible page information as source material, but the owner should verify claims, price, offer terms, image rights, and market-specific details. A URL is not a substitute for approval." },
      { question: "Should I generate the whole ad in one video prompt?", answer: "Usually not. Separate shots are easier to direct, review, replace, and assemble. Use one generation for one clear shot unless the selected model and brief are intentionally designed for a continuous multi-shot result." },
      { question: "Which platforms can the workflow target?", answer: "Editing App supports creative planning for Facebook, Instagram, TikTok, and YouTube. Review each platform's current placement specifications and advertising policies before publishing." },
    ],
    primaryCta: { href: "/creative-studio/video", label: "Create a product video ad" },
    relatedLinks: [
      { href: "/tools/product-url-to-video", label: "Explore the product-URL workflow" },
      { href: "/creative-studio/image", label: "Create a static product ad" },
      { href: "/blog/ai-video-prompt-guide", label: "Write a stronger AI video prompt" },
    ],
  },
] as const;

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function formatBlogDate(date: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
}
