"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function FeatureReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    const desktopOrTablet = window.matchMedia("(min-width: 768px)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!element || !desktopOrTablet || reducedMotion) {
      setRevealed(true);
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.88) {
      setRevealed(true);
      setMounted(true);
      return;
    }

    setMounted(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10%", threshold: 0.18 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("min-w-0", className)}
      data-feature-reveal
      data-reveal-mounted={mounted}
      data-revealed={revealed}
    >
      {children}
    </div>
  );
}
