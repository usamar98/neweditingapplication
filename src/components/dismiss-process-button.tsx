"use client";

import { useState, type MouseEvent } from "react";
import { LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DismissalResult } from "@/lib/job-dismissal";
import { cn } from "@/lib/utils";

async function responseMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  return body?.error?.message ?? "Unable to remove this process. Please try again.";
}

export function DismissProcessButton({
  endpoint,
  label,
  onDismiss,
  onError,
  className,
}: {
  endpoint: string;
  label: string;
  onDismiss: (result: DismissalResult) => void | Promise<void>;
  onError: (message: string) => void;
  className?: string;
}) {
  const [dismissing, setDismissing] = useState(false);

  async function dismiss(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (dismissing) return;
    setDismissing(true);
    onError("");

    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseMessage(response));
      const body = (await response.json()) as { dismissal: DismissalResult };
      await onDismiss(body.dismissal);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to remove this process.");
      setDismissing(false);
    }
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      aria-label={label}
      title={label}
      disabled={dismissing}
      onClick={dismiss}
      className={cn("size-7 rounded-full border border-white/15 bg-black/65 text-white shadow-md backdrop-blur hover:bg-destructive hover:text-destructive-foreground", className)}
    >
      {dismissing ? <LoaderCircle className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
    </Button>
  );
}
