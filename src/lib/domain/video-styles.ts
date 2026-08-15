import { z } from "zod";

export const videoVisualStyles = [
  "natural",
  "cinematic",
  "cartoon",
  "anime",
  "vintage-film",
  "neon-noir",
  "dreamscape",
  "commercial",
] as const;

export const videoVisualStyleSchema = z.enum(videoVisualStyles);
export type VideoVisualStyle = z.infer<typeof videoVisualStyleSchema>;

export type VideoVisualStylePreset = {
  description: string;
  generationDirection: string;
  id: VideoVisualStyle;
  label: string;
  previewBackground: string;
  previewFilter: string;
  previewImage: string;
};

export const videoVisualStylePresets: readonly VideoVisualStylePreset[] = [
  {
    description: "Clean, realistic color with a faithful source look.",
    generationDirection: "Natural live-action realism, faithful color, believable light, physically plausible materials, and restrained post-production.",
    id: "natural",
    label: "Natural",
    previewBackground: "linear-gradient(135deg, #a8c7b8 0%, #e7d6b5 48%, #53685f 100%)",
    previewFilter: "none",
    previewImage: "/media/visual-styles/natural.webp",
  },
  {
    description: "Film contrast, controlled highlights and premium depth.",
    generationDirection: "Feature-film cinematography, dramatic motivated lighting, selective depth of field, anamorphic composition, and a premium cinematic grade.",
    id: "cinematic",
    label: "Cinematic",
    previewBackground: "linear-gradient(135deg, #081d2a 0%, #166b66 44%, #ef9a4a 100%)",
    previewFilter: "contrast(1.12) saturate(.9) brightness(.9)",
    previewImage: "/media/visual-styles/cinematic.webp",
  },
  {
    description: "Bold shapes, vivid color and playful animated energy.",
    generationDirection: "Polished animated-cartoon art direction with bold readable silhouettes, vibrant color, expressive motion, and stable character identity from frame to frame.",
    id: "cartoon",
    label: "Cartoon",
    previewBackground: "linear-gradient(135deg, #ffca3a 0%, #ff595e 48%, #6a4c93 100%)",
    previewFilter: "saturate(1.55) contrast(1.12)",
    previewImage: "/media/visual-styles/cartoon.webp",
  },
  {
    description: "Cel-shaded characters with graphic Japanese animation cues.",
    generationDirection: "Premium anime-inspired animation, clean cel shading, expressive but consistent faces, purposeful line work, dynamic composition, and stable character design.",
    id: "anime",
    label: "Anime",
    previewBackground: "linear-gradient(135deg, #ff9ec4 0%, #9fd8ff 48%, #514a9d 100%)",
    previewFilter: "saturate(1.35) contrast(1.08) brightness(1.04)",
    previewImage: "/media/visual-styles/anime.webp",
  },
  {
    description: "Warm analog color, grain and nostalgic texture.",
    generationDirection: "Shot on vintage motion-picture film with warm faded color, organic grain, soft highlight roll-off, subtle gate texture, and timeless production design.",
    id: "vintage-film",
    label: "Vintage Film",
    previewBackground: "linear-gradient(135deg, #4b3025 0%, #c58c5b 48%, #e4cda5 100%)",
    previewFilter: "sepia(.28) saturate(.82) contrast(.96)",
    previewImage: "/media/visual-styles/vintage-film.webp",
  },
  {
    description: "Electric color, deep shadows and futuristic atmosphere.",
    generationDirection: "Neon-noir visual world with deep controlled blacks, cyan and magenta practical lights, reflective surfaces, atmospheric haze, and cinematic contrast.",
    id: "neon-noir",
    label: "Neon Noir",
    previewBackground: "linear-gradient(135deg, #050510 0%, #5924d6 46%, #00f5d4 100%)",
    previewFilter: "saturate(1.55) contrast(1.2) brightness(.86)",
    previewImage: "/media/visual-styles/neon-noir.webp",
  },
  {
    description: "Soft bloom, luminous color and surreal transitions.",
    generationDirection: "Dreamlike visual storytelling with luminous color, soft atmospheric bloom, graceful surreal transitions, elegant motion, and coherent subjects.",
    id: "dreamscape",
    label: "Dreamscape",
    previewBackground: "linear-gradient(135deg, #b8c0ff 0%, #ffd6ff 48%, #8ecae6 100%)",
    previewFilter: "saturate(1.12) brightness(1.08) contrast(.92)",
    previewImage: "/media/visual-styles/dreamscape.webp",
  },
  {
    description: "Bright, polished visuals built for products and brands.",
    generationDirection: "Premium commercial production with crisp product detail, clean brand-safe lighting, confident composition, controlled color, and a clear hero moment.",
    id: "commercial",
    label: "Commercial",
    previewBackground: "linear-gradient(135deg, #f7f4ea 0%, #83c5be 48%, #006d77 100%)",
    previewFilter: "saturate(1.1) contrast(1.06) brightness(1.02)",
    previewImage: "/media/visual-styles/commercial.webp",
  },
];

export function videoVisualStyleById(id: VideoVisualStyle) {
  return videoVisualStylePresets.find((preset) => preset.id === id) ?? videoVisualStylePresets[0];
}
