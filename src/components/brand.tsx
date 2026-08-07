import Link from "next/link";
import { Clapperboard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_30px_-8px_var(--primary)]">
        <Clapperboard className="size-[18px]" />
        <Sparkles className="absolute -right-1 -top-1 size-3.5 rounded-full bg-background p-0.5 text-primary" />
      </span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[-0.03em]">
          Scene<span className="text-primary">Forge</span>
        </span>
      )}
    </Link>
  );
}
