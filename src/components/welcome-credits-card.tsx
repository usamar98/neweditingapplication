"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Check, Coins, LoaderCircle, LockKeyhole, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CreditSummary } from "@/lib/credits";
import {
  WELCOME_CREDIT_ALLOCATION,
  WELCOME_IMAGE_LIMIT,
  WELCOME_IMAGE_MODEL_LABEL,
} from "@/lib/domain/credits";

async function readClaimError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  return body?.error?.message ?? "Welcome credits could not be claimed. Please try again.";
}

export function WelcomeCreditsCard({
  autoClaim = false,
  credits,
  isAuthenticated,
  onCreditsChange,
}: {
  autoClaim?: boolean;
  credits: CreditSummary | null;
  isAuthenticated: boolean;
  onCreditsChange?: (credits: CreditSummary) => void;
}) {
  const autoClaimStarted = useRef(false);
  const [localCredits, setLocalCredits] = useState<CreditSummary | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const claimDestination = "/generate/image?claim=welcome";
  const loginHref = `/login?mode=signup&next=${encodeURIComponent(claimDestination)}` as Route;

  const claim = useCallback(async () => {
    if (!isAuthenticated) return;
    setClaiming(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/credits", { method: "POST" });
      if (!response.ok) throw new Error(await readClaimError(response));
      const body = (await response.json()) as { credits: CreditSummary };
      if (onCreditsChange) onCreditsChange(body.credits);
      else setLocalCredits(body.credits);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Welcome credits could not be claimed.");
    } finally {
      setClaiming(false);
    }
  }, [isAuthenticated, onCreditsChange]);

  const current = localCredits ?? credits;

  useEffect(() => {
    if (!autoClaim || !isAuthenticated || current?.welcomeClaimed || autoClaimStarted.current) return;
    autoClaimStarted.current = true;
    void claim();
  }, [autoClaim, claim, current?.welcomeClaimed, isAuthenticated]);

  const paid = current?.active === true;
  const claimed = current?.welcomeClaimed === true;
  const imagesRemaining = current?.welcomeImagesRemaining ?? 0;

  return (
    <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(135deg,var(--card),color-mix(in_oklab,var(--primary)_7%,var(--card)))] shadow-sm">
      <CardContent className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-25" />
        <div className="relative flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
            <Coins className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-[-0.025em]">{WELCOME_CREDIT_ALLOCATION} welcome credits</h2>
              <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">One time</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create up to {WELCOME_IMAGE_LIMIT} private images with {WELCOME_IMAGE_MODEL_LABEL}. The free model is fixed; subscribing unlocks every image model, video generation, editing, ads, and background removal.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Check className="size-3 text-primary" /> No payment required</span>
              <span className="inline-flex items-center gap-1.5"><LockKeyhole className="size-3 text-primary" /> One claim per account</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3 text-primary" /> 5 credits per image</span>
            </div>
          </div>
        </div>

        <div className="relative min-w-48 lg:text-right">
          {paid ? (
            <>
              <p className="text-sm font-medium text-primary">Paid workspace active</p>
              <p className="mt-1 text-xs text-muted-foreground">{current.remainingCredits.toLocaleString()} monthly credits remaining</p>
              <Button asChild variant="outline" className="mt-3"><Link href="/account#billing">View billing</Link></Button>
            </>
          ) : claimed ? (
            <>
              <p className="text-2xl font-semibold tracking-[-0.04em]">{imagesRemaining} image{imagesRemaining === 1 ? "" : "s"} left</p>
              <p className="mt-1 text-xs text-muted-foreground">{current.welcomeRemainingCredits} welcome credits remaining</p>
              <Button asChild className="mt-3"><Link href="/generate/image">Open image studio <ArrowRight className="size-4" /></Link></Button>
            </>
          ) : isAuthenticated ? (
            <Button onClick={() => void claim()} disabled={claiming} size="lg">
              {claiming ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {claiming ? "Claiming credits…" : "Claim 20 free credits"}
            </Button>
          ) : (
            <Button asChild size="lg"><Link href={loginHref}>Claim 20 free credits <ArrowRight className="size-4" /></Link></Button>
          )}
        </div>

        {error ? <Alert variant="destructive" className="relative lg:col-span-2"><AlertDescription>{error}</AlertDescription></Alert> : null}
      </CardContent>
    </Card>
  );
}
