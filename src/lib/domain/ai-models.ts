import { z } from "zod";

export const imageAgentIds = ["auto", "flux-2-max", "flux-2", "flux-2-turbo"] as const;
export const videoAgentIds = ["auto", "veo-3-1", "veo-3-1-fast"] as const;
export const backgroundAgentIds = ["auto", "birefnet-v2", "rembg-fast"] as const;
export const performanceCreativeAgentIds = [
  "auto",
  "veo-3-1-performance",
  "veo-3-1-fast-performance",
  "video-understanding-scout",
] as const;

export const imageAgentIdSchema = z.enum(imageAgentIds);
export const videoAgentIdSchema = z.enum(videoAgentIds);
export const backgroundAgentIdSchema = z.enum(backgroundAgentIds);
export const performanceCreativeAgentIdSchema = z.enum(performanceCreativeAgentIds);

export type ImageAgentId = z.infer<typeof imageAgentIdSchema>;
export type VideoAgentId = z.infer<typeof videoAgentIdSchema>;
export type BackgroundAgentId = z.infer<typeof backgroundAgentIdSchema>;
export type PerformanceCreativeAgentId = z.infer<typeof performanceCreativeAgentIdSchema>;
export type PerformanceCreativeSourceType = "long_video" | "product_url";

export type AiAgent = {
  description: string;
  endpointId: string | null;
  id: string;
  label: string;
  tag: string;
};

export const imageAgents: readonly AiAgent[] = [
  { id: "auto", endpointId: null, label: "Image Autopilot", tag: "Recommended", description: "Chooses the strongest fit for your quality, speed, and cost intent." },
  { id: "flux-2-max", endpointId: "fal-ai/flux-2-max", label: "FLUX.2 Max", tag: "Maximum quality", description: "Premium realism, typography, materials, and campaign-grade detail." },
  { id: "flux-2", endpointId: "fal-ai/flux-2", label: "FLUX.2", tag: "Balanced", description: "Strong visual fidelity with a balanced generation time." },
  { id: "flux-2-turbo", endpointId: "fal-ai/flux-2/turbo", label: "FLUX.2 Turbo", tag: "Fast", description: "Rapid concept generation and iteration." },
];

export const videoAgents: readonly AiAgent[] = [
  { id: "auto", endpointId: null, label: "Video Autopilot", tag: "Recommended", description: "Routes each brief to the best compatible cinematic model." },
  { id: "veo-3-1", endpointId: "fal-ai/veo3.1", label: "Veo 3.1", tag: "Cinematic", description: "High-fidelity motion, consistency, and native synchronized audio." },
  { id: "veo-3-1-fast", endpointId: "fal-ai/veo3.1/fast", label: "Veo 3.1 Fast", tag: "Faster", description: "A quicker native-audio workflow for iterations and social content." },
];

export const backgroundAgents: readonly AiAgent[] = [
  { id: "auto", endpointId: null, label: "Cutout Autopilot", tag: "Recommended", description: "Selects the best model for clean edges and subject type." },
  { id: "birefnet-v2", endpointId: "fal-ai/birefnet/v2", label: "BiRefNet V2", tag: "Precision", description: "High-resolution matting for hair, products, people, and fine edges." },
  { id: "rembg-fast", endpointId: "fal-ai/imageutils/rembg", label: "Rembg Fast", tag: "Fast", description: "Quick, economical removal for clean and simple subjects." },
];

export const performanceCreativeAgents: readonly (AiAgent & {
  sources: readonly PerformanceCreativeSourceType[];
})[] = [
  {
    id: "auto",
    endpointId: null,
    label: "Performance Autopilot",
    tag: "Recommended",
    description: "Chooses a premium product-ad director or a conversion-focused clip scout for the supplied source.",
    sources: ["product_url", "long_video"],
  },
  {
    id: "veo-3-1-performance",
    endpointId: "fal-ai/veo3.1/image-to-video",
    label: "Veo 3.1 Ad Director",
    tag: "Premium product ads",
    description: "Campaign-grade product motion, native audio, strong visual consistency, and premium pacing.",
    sources: ["product_url"],
  },
  {
    id: "veo-3-1-fast-performance",
    endpointId: "fal-ai/veo3.1/fast/image-to-video",
    label: "Veo 3.1 Growth Lab",
    tag: "Fast testing",
    description: "Faster product-ad variants for testing hooks and social creative directions.",
    sources: ["product_url"],
  },
  {
    id: "video-understanding-scout",
    endpointId: "fal-ai/video-understanding",
    label: "Video Understanding Scout",
    tag: "Long-video clips",
    description: "Finds the strongest self-contained hook in long footage before a platform-native render.",
    sources: ["long_video"],
  },
];

export function performanceCreativeAgentsForSource(sourceType: PerformanceCreativeSourceType) {
  return performanceCreativeAgents.filter((agent) => agent.sources.includes(sourceType));
}

export function performanceCreativeAgentSupportsSource(
  agentId: string,
  sourceType: PerformanceCreativeSourceType,
) {
  return performanceCreativeAgents.some(
    (agent) => agent.id === agentId && agent.sources.includes(sourceType),
  );
}

export function endpointForPerformanceCreativeAgent(
  agentId: string,
  sourceType: PerformanceCreativeSourceType,
) {
  const agent = performanceCreativeAgents.find(
    (candidate) => candidate.id === agentId && candidate.sources.includes(sourceType),
  );
  return agent?.endpointId ?? null;
}

export function agentsForKind(kind: "image" | "video" | "background_removal") {
  if (kind === "image") return imageAgents;
  if (kind === "video") return videoAgents;
  return backgroundAgents;
}

export function endpointForAgent(
  kind: "image" | "video" | "background_removal",
  agentId: string,
) {
  const agent = agentsForKind(kind).find((candidate) => candidate.id === agentId);
  return agent?.endpointId ?? null;
}
