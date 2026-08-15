import { Check, Sparkles } from "lucide-react";
import {
  videoVisualStylePresets,
  type VideoVisualStyle,
} from "@/lib/domain/video-styles";
import { cn } from "@/lib/utils";

export function VideoStylePicker({
  compact = false,
  onChange,
  value,
}: {
  compact?: boolean;
  onChange: (value: VideoVisualStyle) => void;
  value: VideoVisualStyle;
}) {
  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", !compact && "lg:grid-cols-4")}>
      {videoVisualStylePresets.map((preset) => {
        const selected = value === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(preset.id)}
            className={cn(
              "group overflow-hidden rounded-xl border bg-card text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary/45 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
                : "border-border hover:border-primary/25",
            )}
          >
            <span
              className={cn("relative block overflow-hidden", compact ? "h-14" : "h-20")}
              style={{ background: preset.previewBackground }}
            >
              <span className="absolute -bottom-5 left-[12%] size-14 rounded-full border border-white/20 bg-black/25 shadow-2xl backdrop-blur-sm transition duration-300 group-hover:-translate-y-1" />
              <span className="absolute right-[12%] top-3 h-8 w-14 rotate-[-12deg] rounded-full border border-white/20 bg-white/20 blur-[1px]" />
              <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_25%,rgba(255,255,255,.18)_48%,transparent_68%)] opacity-60" />
              {selected && <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" /></span>}
            </span>
            <span className={cn("block", compact ? "p-2.5" : "p-3")}>
              <span className="flex items-center gap-1.5 text-sm font-medium">{selected && <Sparkles className="size-3.5 text-primary" />}{preset.label}</span>
              {!compact && <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{preset.description}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
