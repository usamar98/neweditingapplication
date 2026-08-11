"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- The hash link returns from an app page to the landing-page pricing section. */

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, CircleAlert, Coins, CreditCard, LoaderCircle, PauseCircle, Save, Trash2 } from "lucide-react";
import { deactivateAccount, deleteAccount, updateAvatar, updateProfile } from "@/app/actions/account";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { CreditSummary } from "@/lib/credits";
import { createClient } from "@/lib/supabase/client";

type AccountProps = {
  avatarUrl: string | null;
  billing: {
    cancelAtPeriodEnd: boolean;
    plan: string | null;
    status: string | null;
    subscriptionId: string | null;
  };
  credits: CreditSummary;
  displayName: string;
  email: string;
  userId: string;
  username: string;
};

export function AccountSettings(props: AccountProps) {
  const router = useRouter();
  const avatarInput = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(props.avatarUrl);
  const [displayName, setDisplayName] = useState(props.displayName);
  const [username, setUsername] = useState(props.username);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const creditUsagePercent = props.credits.allocatedCredits > 0
    ? Math.min(100, ((props.credits.consumedCredits + props.credits.reservedCredits) / props.credits.allocatedCredits) * 100)
    : 0;

  function saveProfile() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfile({ displayName, username });
      setMessage(result.error ?? "Profile saved.");
      if (!result.error) router.refresh();
    });
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage("Choose a JPG, PNG, or WebP avatar no larger than 5 MB.");
      return;
    }
    const path = `${props.userId}/avatar`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: true });
    if (error) return setMessage(`Avatar upload failed: ${error.message}`);
    const result = await updateAvatar(path);
    if (result.error) return setMessage(result.error);
    setAvatarUrl(`${result.avatarUrl}?v=${Date.now()}`);
    setMessage("Profile picture updated.");
    router.refresh();
  }

  async function openPortal(flow: "manage" | "cancel") {
    setMessage(null);
    const response = await fetch("/api/billing/portal", { body: JSON.stringify({ flow }), headers: { "Content-Type": "application/json" }, method: "POST" });
    const body = (await response.json().catch(() => null)) as { error?: { message?: string }; url?: string } | null;
    if (!response.ok || !body?.url) return setMessage(body?.error?.message ?? "Billing portal is unavailable.");
    window.location.assign(body.url);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div><p className="text-sm font-medium text-primary">Account</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Your profile and subscription</h1><p className="mt-2 text-sm text-muted-foreground">Manage how you appear, your billing, and the lifecycle of your account.</p></div>
      {message && <Alert><CircleAlert className="size-4" /><AlertDescription>{message}</AlertDescription></Alert>}

      <Card className="border-border bg-card/70"><CardHeader><CardTitle>Profile</CardTitle></CardHeader><CardContent className="space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center"><button type="button" onClick={() => avatarInput.current?.click()} className="group relative rounded-full"><Avatar className="size-24"><AvatarImage src={avatarUrl ?? undefined} alt="" /><AvatarFallback className="bg-primary/10 text-xl text-primary">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="absolute inset-0 grid place-items-center rounded-full bg-black/60 opacity-0 transition group-hover:opacity-100"><Camera className="size-5" /></span></button><div><p className="font-medium">Profile picture</p><p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WebP. Maximum 5 MB.</p><Button variant="outline" size="sm" className="mt-3" onClick={() => avatarInput.current?.click()}>Upload picture</Button><input ref={avatarInput} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadAvatar(event.target.files?.[0])} /></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="display-name">Display name</Label><Input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} /></div><div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} maxLength={30} /></div><div className="space-y-2 sm:col-span-2"><Label>Email</Label><Input value={props.email} disabled /></div></div>
        <Button onClick={saveProfile} disabled={pending}><Save className="size-4" />{pending ? "Saving…" : "Save profile"}</Button>
      </CardContent></Card>

      <Card id="billing" className="scroll-mt-24 border-border bg-card/70"><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="size-5 text-primary" /> Billing & subscription</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-5 rounded-xl border border-border bg-muted/55 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-medium capitalize">{props.billing.plan ?? "No paid plan"}</p>{props.billing.status && <Badge variant="outline" className="capitalize">{props.billing.status.replaceAll("_", " ")}</Badge>}</div><p className="mt-2 text-sm text-muted-foreground">{props.billing.cancelAtPeriodEnd ? "Cancellation is scheduled at the end of the billing period." : props.billing.subscriptionId ? "Stripe securely manages invoices, payment methods, plan changes, and cancellation." : "Choose a plan from Pricing to start a subscription."}</p><p className="mt-3 text-xs text-muted-foreground"><Link href="/legal/subscriptions-credits-refunds" className="font-medium text-foreground underline underline-offset-4">Subscription, credits, cancellation & refunds</Link></p></div><div className="flex flex-wrap gap-2">{props.billing.subscriptionId ? <><Button variant="outline" onClick={() => void openPortal("manage")}>Manage billing</Button><Button variant="destructive" onClick={() => void openPortal("cancel")}>Cancel subscription</Button></> : <Button asChild><a href="/#pricing">View plans</a></Button>}</div></div><div className="rounded-xl border border-border bg-card/60 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Coins className="size-4" /></span><div><p className="font-medium">Monthly credits</p><p className="mt-1 text-xs text-muted-foreground">Reserved credits are held while work is queued or processing.</p></div></div><div className="text-left sm:text-right"><p className="text-2xl font-semibold tracking-[-0.03em]">{props.credits.remainingCredits.toLocaleString()}</p><p className="text-xs text-muted-foreground">of {props.credits.allocatedCredits.toLocaleString()} remaining</p></div></div><Progress value={creditUsagePercent} className="mt-5 h-2" /><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span>{props.credits.consumedCredits.toLocaleString()} used</span><span>{props.credits.reservedCredits.toLocaleString()} reserved</span><span>{props.credits.activeGenerations}/{props.credits.concurrencyLimit} active slots</span>{props.credits.periodEnd ? <span>Resets {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(props.credits.periodEnd))}</span> : null}</div></div></CardContent></Card>

      <Card className="border-destructive/20 bg-destructive/[0.035]"><CardHeader><CardTitle>Account lifecycle</CardTitle></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-border p-5"><PauseCircle className="size-5 text-amber-700" /><h3 className="mt-4 font-medium">Deactivate account</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Temporarily blocks workspace access. You can sign in and reactivate later. Active subscriptions must be cancelled first.</p><Dialog><DialogTrigger asChild><Button variant="outline" className="mt-5">Deactivate</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Deactivate your account?</DialogTitle><DialogDescription>Your projects remain stored, but workspace access stops until you reactivate.</DialogDescription></DialogHeader><DialogFooter><Button variant="destructive" onClick={() => startTransition(async () => { const result = await deactivateAccount(); if (result?.error) setMessage(result.error); })}>Deactivate account</Button></DialogFooter></DialogContent></Dialog></div><div className="rounded-xl border border-destructive/20 p-5"><Trash2 className="size-5 text-red-700" /><h3 className="mt-4 font-medium">Delete account permanently</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Cancels an active subscription, removes private files and projects, and deletes your login. This cannot be undone.</p><Dialog><DialogTrigger asChild><Button variant="destructive" className="mt-5">Delete account</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Permanently delete this account?</DialogTitle><DialogDescription>Enter your current password to confirm. All stored media and account data will be removed.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="delete-password">Current password</Label><Input id="delete-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></div><DialogFooter><Button variant="destructive" disabled={!password || pending} onClick={() => startTransition(async () => { const result = await deleteAccount(password); if (result?.error) setMessage(result.error); })}>{pending && <LoaderCircle className="size-4 animate-spin" />}Delete forever</Button></DialogFooter></DialogContent></Dialog></div></div><p className="mt-4 text-xs leading-5 text-muted-foreground">Read how deactivation, deletion, backups, and legally required records are handled in the <Link href="/legal/privacy#retention" className="font-medium text-foreground underline underline-offset-4">Privacy Policy</Link>.</p></CardContent></Card>
    </main>
  );
}
