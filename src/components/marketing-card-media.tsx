import Image, { type StaticImageData } from "next/image";
import aiImageVisual from "@/assets/media/ai-image.webp";
import aiVideoVisual from "@/assets/media/ai-video.webp";
import aiClipperVisual from "@/assets/media/ai-clipper.webp";
import aiAdCreativeVisual from "@/assets/media/generated/ai-ad-creative.webp";
import { cn } from "@/lib/utils";

type MarketingMediaSlug =
  | "ai-clipper"
  | "ai-video-generator"
  | "ai-image-generator"
  | "performance-creative-studio"
  | "background-remover"
  | "product-url-to-video"
  | "long-video-to-shorts";

type VideoMedia = {
  alt: string;
  label: string;
  poster: StaticImageData;
  src: string;
};

const videoMedia: Partial<Record<MarketingMediaSlug, VideoMedia>> = {
  "ai-clipper": {
    alt: "AI Clipper finding high-retention moments inside a long-form interview",
    label: "Best moments to social clips",
    poster: aiClipperVisual,
    src: "/media/previews/ai-clipper.mp4",
  },
  "long-video-to-shorts": {
    alt: "A professional editor finding short-form highlights in a long interview",
    label: "Long video to short clips",
    poster: aiClipperVisual,
    src: "/media/previews/ai-clipper.mp4",
  },
  "ai-video-generator": {
    alt: "A cinematic concept car shot representing premium AI video generation",
    label: "Multi-model video preview",
    poster: aiVideoVisual,
    src: "/media/previews/ai-video-generator.mp4",
  },
  "performance-creative-studio": {
    alt: "An ecommerce product and mobile campaign storyboard prepared for social video ads",
    label: "Product URL to video ad",
    poster: aiAdCreativeVisual,
    src: "/media/previews/ai-ad-creative-generator.mp4",
  },
  "product-url-to-video": {
    alt: "An ecommerce product and mobile campaign storyboard prepared from a product URL",
    label: "URL to ecommerce video ad",
    poster: aiAdCreativeVisual,
    src: "/media/previews/ai-ad-creative-generator.mp4",
  },
};

export function MarketingCardMedia({
  slug,
  className,
}: {
  slug: MarketingMediaSlug;
  className?: string;
}) {
  const video = videoMedia[slug];

  if (video) {
    return (
      <div className={cn("group/media relative aspect-video overflow-hidden border-b border-border bg-muted", className)}>
        <Image
          src={video.poster}
          alt={video.alt}
          fill
          placeholder="blur"
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition duration-700 group-hover/media:scale-[1.025]"
        />
        <video
          aria-hidden="true"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={video.poster.src}
          className="absolute inset-0 hidden size-full object-cover md:block motion-reduce:hidden"
        >
          <source
            src={video.src}
            type="video/mp4"
            media="(min-width: 768px) and (prefers-reduced-motion: no-preference)"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/10" />
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/80 sm:inset-x-5">
          <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 backdrop-blur">{video.label}</span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1.5 backdrop-blur">
            <span className="marketing-media-live-dot size-1.5 rounded-full bg-emerald-300" /> Preview
          </span>
        </div>
      </div>
    );
  }

  if (slug === "background-remover") {
    return (
      <div className={cn("relative aspect-video overflow-hidden border-b border-border bg-[linear-gradient(45deg,#ece9df_25%,transparent_25%),linear-gradient(-45deg,#ece9df_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ece9df_75%),linear-gradient(-45deg,transparent_75%,#ece9df_75%)] bg-[length:22px_22px]", className)}>
        <Image
          src={aiImageVisual}
          alt="A premium product photograph shown before and after AI background removal"
          fill
          placeholder="blur"
          sizes="(max-width: 768px) 100vw, 50vw"
          className="marketing-media-image object-cover"
        />
        <div className="absolute inset-y-0 right-0 w-[48%] overflow-hidden border-l border-white/60 bg-[#eeeae0]/75 backdrop-blur-sm">
          <Image src={aiImageVisual} alt="" fill placeholder="blur" sizes="25vw" className="object-contain mix-blend-multiply" />
        </div>
        <div className="marketing-media-scan absolute inset-y-0 left-1/2 w-px bg-white shadow-[0_0_18px_3px_rgba(255,255,255,0.8)]" />
        <span className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/85 backdrop-blur">Before / transparent PNG</span>
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-video overflow-hidden border-b border-border bg-muted", className)}>
      <Image
        src={aiImageVisual}
        alt="A cinematic perfume campaign image representing directed AI image generation"
        fill
        placeholder="blur"
        sizes="(max-width: 768px) 100vw, 50vw"
        className="marketing-media-image object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
      <div className="marketing-media-palette absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white/80 backdrop-blur">
        <span>Art directed</span>
        {['#d8b46a', '#31584a', '#f1e9d8'].map((color) => <span key={color} className="size-2.5 rounded-full border border-white/25" style={{ backgroundColor: color }} />)}
      </div>
    </div>
  );
}
