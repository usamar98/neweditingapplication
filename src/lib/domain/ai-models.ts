import { z } from "zod";

export const imageAgentIds = [
  "auto",
  "seedream-5-pro",
  "recraft-4-1-pro",
  "nano-banana-2",
  "flux-2-max",
  "seedream-5-lite",
  "flux-2-turbo",
] as const;
export const videoAgentIds = [
  "auto",
  "seedance-2-5",
  "veo-3-1",
  "ltx-2-3-pro",
  "kling-3-pro",
  "veo-3-1-fast",
] as const;
export const editorAgentIds = [
  "auto",
  "gpt-5-mini-editor",
  "gemini-2-5-flash-editor",
  "gemini-2-5-flash-lite-editor",
  "local-editor",
] as const;
export const backgroundAgentIds = ["auto", "birefnet-v2", "rembg-fast"] as const;
export const performanceCreativeAgentIds = [
  "auto",
  "seedance-2-5-performance",
  "veo-3-1-performance",
  "veo-3-1-fast-performance",
  "video-understanding-scout",
  "nano-banana-2-product-ad",
  "recraft-4-1-static-ad",
  "seedream-5-static-ad",
  "nano-banana-2-static-ad",
  "flux-2-max-static-ad",
] as const;

export const videoDurations = ["4s", "6s", "8s", "10s", "12s", "15s", "16s", "20s", "30s"] as const;
export const videoResolutions = ["720p", "1080p", "4k"] as const;

export const imageAgentIdSchema = z.enum(imageAgentIds);
export const videoAgentIdSchema = z.enum(videoAgentIds);
export const editorAgentIdSchema = z.enum(editorAgentIds);
export const backgroundAgentIdSchema = z.enum(backgroundAgentIds);
export const performanceCreativeAgentIdSchema = z.enum(performanceCreativeAgentIds);

export type ImageAgentId = z.infer<typeof imageAgentIdSchema>;
export type VideoAgentId = z.infer<typeof videoAgentIdSchema>;
export type EditorAgentId = z.infer<typeof editorAgentIdSchema>;
export type BackgroundAgentId = z.infer<typeof backgroundAgentIdSchema>;
export type PerformanceCreativeAgentId = z.infer<typeof performanceCreativeAgentIdSchema>;
export type VideoDuration = (typeof videoDurations)[number];
export type VideoResolution = (typeof videoResolutions)[number];
export type PerformanceCreativeOutputType = "image" | "video";
export type PerformanceCreativeSourceType = "business_brief" | "long_video" | "product_url";

export type AiAgent = {
  description: string;
  endpointId: string | null;
  id: string;
  label: string;
  tag: string;
};

export type VideoAgent = AiAgent & {
  durations: readonly VideoDuration[];
  resolutions: readonly VideoResolution[];
  supportsAudio: boolean;
};

export const imageAgents: readonly AiAgent[] = [
  { id: "auto", endpointId: null, label: "Image Autopilot", tag: "Recommended", description: "Chooses the strongest compatible model for your quality, speed, and cost intent." },
  { id: "seedream-5-pro", endpointId: "bytedance/seedream/v5/pro/text-to-image", label: "Seedream 5.0 Pro", tag: "Premium detail", description: "Deep prompt understanding, strong typography, and polished campaign composition." },
  { id: "recraft-4-1-pro", endpointId: "fal-ai/recraft/v4.1/pro/text-to-image", label: "Recraft V4.1 Pro", tag: "Brand design", description: "High-resolution brand graphics, product layouts, and controlled commercial art direction." },
  { id: "nano-banana-2", endpointId: "fal-ai/nano-banana-2", label: "Nano Banana 2", tag: "Prompt fidelity", description: "Strong instruction following for precise, production-ready visual concepts." },
  { id: "flux-2-max", endpointId: "fal-ai/flux-2-max", label: "FLUX.2 Max", tag: "Photoreal", description: "Premium realism, materials, typography, and campaign-grade detail." },
  { id: "seedream-5-lite", endpointId: "bytedance/seedream/v5/lite/text-to-image", label: "Seedream 5.0 Lite", tag: "Fast 3K", description: "Fast, economical high-resolution images for rapid creative iteration." },
  { id: "flux-2-turbo", endpointId: "fal-ai/flux-2/turbo", label: "FLUX.2 Turbo", tag: "Fast", description: "Rapid concept generation and iteration." },
];

export const videoAgents: readonly VideoAgent[] = [
  {
    id: "auto", endpointId: null, label: "Video Autopilot", tag: "Recommended",
    description: "Routes each brief to the best compatible premium video model.",
    durations: videoDurations, resolutions: videoResolutions, supportsAudio: true,
  },
  {
    id: "seedance-2-5", endpointId: "bytedance/seedance-2.5/text-to-video", label: "Seedance 2.5", tag: "Latest · up to 30s",
    description: "Long single-shot clips with native audio and strong motion consistency.",
    durations: ["4s", "6s", "8s", "10s", "12s", "15s", "16s", "20s", "30s"], resolutions: ["720p"], supportsAudio: true,
  },
  {
    id: "veo-3-1", endpointId: "fal-ai/veo3.1", label: "Veo 3.1", tag: "Native 4K",
    description: "High-fidelity cinematic motion with native synchronized audio and supported 4K output.",
    durations: ["4s", "6s", "8s"], resolutions: ["720p", "1080p", "4k"], supportsAudio: true,
  },
  {
    id: "ltx-2-3-pro", endpointId: "fal-ai/ltx-2.3/text-to-video", label: "LTX 2.3 Pro", tag: "Latest · native 4K",
    description: "Sharp premium video with native audio, high frame-rate options, and supported 4K output.",
    durations: ["6s", "8s", "10s"], resolutions: ["1080p", "4k"], supportsAudio: true,
  },
  {
    id: "kling-3-pro", endpointId: "fal-ai/kling-video/v3/pro/text-to-video", label: "Kling 3 Pro", tag: "Motion realism",
    description: "Realistic movement, flexible shot length, and native audio for social and product scenes.",
    durations: ["4s", "6s", "8s", "10s", "15s"], resolutions: ["1080p"], supportsAudio: true,
  },
  {
    id: "veo-3-1-fast", endpointId: "fal-ai/veo3.1/fast", label: "Veo 3.1 Fast", tag: "Fast native audio",
    description: "A quicker native-audio workflow for iterations and social content.",
    durations: ["4s", "6s", "8s"], resolutions: ["720p", "1080p"], supportsAudio: true,
  },
];

export const editorAgents: readonly AiAgent[] = [
  { id: "auto", endpointId: null, label: "Clipper Autopilot", tag: "Recommended", description: "Chooses the best available model for moment detection and clip ranking." },
  { id: "gpt-5-mini-editor", endpointId: "openai/gpt-5-mini", label: "GPT-5 mini Clip Ranker", tag: "Deep analysis", description: "Detailed hook, highlight, pacing, and story-structure analysis." },
  { id: "gemini-2-5-flash-editor", endpointId: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", tag: "Balanced", description: "Fast, reliable transcript and scene analysis." },
  { id: "gemini-2-5-flash-lite-editor", endpointId: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", tag: "Economical", description: "Quick analysis for drafts and shorter workflows." },
  { id: "local-editor", endpointId: "local", label: "Local Clip Analyzer", tag: "Private fallback", description: "Deterministic local moment analysis without a paid language-model call." },
];

export const backgroundAgents: readonly AiAgent[] = [
  { id: "auto", endpointId: null, label: "Cutout Autopilot", tag: "Recommended", description: "Selects the best model for clean edges and subject type." },
  { id: "birefnet-v2", endpointId: "fal-ai/birefnet/v2", label: "BiRefNet V2", tag: "Precision", description: "High-resolution matting for hair, products, people, and fine edges." },
  { id: "rembg-fast", endpointId: "fal-ai/imageutils/rembg", label: "Rembg Fast", tag: "Fast", description: "Quick, economical removal for clean and simple subjects." },
];

export const performanceCreativeAgents: readonly (AiAgent & {
  outputTypes: readonly PerformanceCreativeOutputType[];
  sources: readonly PerformanceCreativeSourceType[];
})[] = [
  { id: "auto", endpointId: null, label: "Ad Creative Autopilot", tag: "Recommended", description: "Chooses the strongest compatible image designer, product compositor, video director, or clip scout for the brief.", outputTypes: ["image", "video"], sources: ["business_brief", "product_url", "long_video"] },
  { id: "seedance-2-5-performance", endpointId: "bytedance/seedance-2.5/image-to-video", label: "Seedance 2.5 Ad Director", tag: "Latest", description: "Product-led motion with native audio and strong identity consistency.", outputTypes: ["video"], sources: ["product_url"] },
  { id: "veo-3-1-performance", endpointId: "fal-ai/veo3.1/image-to-video", label: "Veo 3.1 Ad Director", tag: "Premium product ads", description: "Campaign-grade product motion, native audio, strong visual consistency, and premium pacing.", outputTypes: ["video"], sources: ["product_url"] },
  { id: "veo-3-1-fast-performance", endpointId: "fal-ai/veo3.1/fast/image-to-video", label: "Veo 3.1 Growth Lab", tag: "Fast testing", description: "Faster product-ad variants for testing hooks and social creative directions.", outputTypes: ["video"], sources: ["product_url"] },
  { id: "video-understanding-scout", endpointId: "fal-ai/video-understanding", label: "Video Understanding Scout", tag: "Long-video clips", description: "Finds the strongest self-contained hook in long footage before a platform-native render.", outputTypes: ["video"], sources: ["long_video"] },
  { id: "nano-banana-2-product-ad", endpointId: "fal-ai/nano-banana-2/edit", label: "Nano Banana 2 Product Composer", tag: "Product fidelity", description: "Uses the product-page image as a visual reference while composing a platform-ready static advertisement.", outputTypes: ["image"], sources: ["product_url"] },
  { id: "recraft-4-1-static-ad", endpointId: "fal-ai/recraft/v4.1/pro/text-to-image", label: "Recraft V4.1 Brand Designer", tag: "Graphic design", description: "Creates polished brand-led layouts for services, stores, restaurants, events, and local campaigns.", outputTypes: ["image"], sources: ["business_brief"] },
  { id: "seedream-5-static-ad", endpointId: "bytedance/seedream/v5/pro/text-to-image", label: "Seedream 5 Campaign Designer", tag: "Premium typography", description: "Builds premium campaign compositions with strong layout and text understanding.", outputTypes: ["image"], sources: ["business_brief"] },
  { id: "nano-banana-2-static-ad", endpointId: "fal-ai/nano-banana-2", label: "Nano Banana 2 Ad Designer", tag: "Prompt fidelity", description: "Follows detailed business, audience, offer, and placement instructions for focused static ads.", outputTypes: ["image"], sources: ["business_brief"] },
  { id: "flux-2-max-static-ad", endpointId: "fal-ai/flux-2-max", label: "FLUX.2 Max Photo Director", tag: "Photoreal", description: "Creates premium photoreal campaign imagery for local services and product-led promotions.", outputTypes: ["image"], sources: ["business_brief"] },
];

export function videoAgentById(agentId: string) {
  return videoAgents.find((agent) => agent.id === agentId);
}

export function compatibleVideoEndpoints(duration: VideoDuration, resolution: VideoResolution) {
  return videoAgents
    .filter((agent) => agent.endpointId && agent.durations.includes(duration) && agent.resolutions.includes(resolution))
    .map((agent) => agent.endpointId as string);
}

export function videoAgentSupports(agentId: string, duration: VideoDuration, resolution: VideoResolution) {
  const agent = videoAgentById(agentId);
  return Boolean(agent?.durations.includes(duration) && agent.resolutions.includes(resolution));
}

export function endpointForEditorAgent(agentId: string) {
  return editorAgents.find((agent) => agent.id === agentId)?.endpointId ?? null;
}

export function performanceCreativeAgentsForSource(
  sourceType: PerformanceCreativeSourceType,
  outputType: PerformanceCreativeOutputType,
) {
  return performanceCreativeAgents.filter(
    (agent) => agent.sources.includes(sourceType) && agent.outputTypes.includes(outputType),
  );
}

export function performanceCreativeAgentSupportsSource(
  agentId: string,
  sourceType: PerformanceCreativeSourceType,
  outputType: PerformanceCreativeOutputType,
) {
  return performanceCreativeAgents.some(
    (agent) => agent.id === agentId && agent.sources.includes(sourceType) && agent.outputTypes.includes(outputType),
  );
}

export function endpointForPerformanceCreativeAgent(
  agentId: string,
  sourceType: PerformanceCreativeSourceType,
  outputType: PerformanceCreativeOutputType,
) {
  return performanceCreativeAgents.find(
    (candidate) => candidate.id === agentId
      && candidate.sources.includes(sourceType)
      && candidate.outputTypes.includes(outputType),
  )?.endpointId ?? null;
}

export function agentsForKind(kind: "image" | "video" | "background_removal") {
  if (kind === "image") return imageAgents;
  if (kind === "video") return videoAgents;
  return backgroundAgents;
}

export function endpointForAgent(kind: "image" | "video" | "background_removal", agentId: string) {
  return agentsForKind(kind).find((candidate) => candidate.id === agentId)?.endpointId ?? null;
}
