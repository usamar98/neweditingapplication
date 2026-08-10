import { cn } from "@/lib/utils";

export function FeatureReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)} data-feature-reveal>
      {children}
    </div>
  );
}
