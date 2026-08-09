"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "confirmation_failed" ? "That confirmation link is invalid or expired." : null,
  );
  const [notice, setNotice] = useState<string | null>(
    searchParams.get("notice") === "deactivated" ? "Your account is inactive. Sign in whenever you want to reactivate it." : null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();
  const title = mode === "signup" ? "Create your workspace" : "Welcome back";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const displayName = String(form.get("displayName") ?? "").trim();
    const username = String(form.get("username") ?? "").trim().toLowerCase();
    setError(null);
    setNotice(null);

    if (mode === "signup" && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError("Use at least 8 characters with uppercase, lowercase, and a number.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, username },
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        if (authError) {
          setError(authError.message);
          return;
        }
        if (!data.session) {
          setNotice("Check your email to confirm your account, then return here to sign in.");
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          setError(authError.message);
          return;
        }
      }

      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-[-0.035em]">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup" ? "Start editing with your private media workspace." : "Sign in to continue editing your projects."}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" && (
          <><div className="space-y-2"><Label htmlFor="displayName">Display name</Label><Input id="displayName" name="displayName" autoComplete="name" minLength={2} maxLength={80} required placeholder="Ada Lovelace" /></div><div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" name="username" autoComplete="username" minLength={3} maxLength={30} pattern="[a-z0-9_]+" required placeholder="ada_creates" /><p className="text-xs text-muted-foreground">Lowercase letters, numbers, and underscores only.</p></div></>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@studio.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required className="pr-11" />
            <Button type="button" variant="ghost" size="icon" className="absolute right-0.5 top-0.5 size-8" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
          {mode === "signup" && <p className="text-xs text-muted-foreground">At least 8 characters with upper/lowercase letters and a number.</p>}
        </div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {notice && <Alert><AlertDescription>{notice}</AlertDescription></Alert>}
        <Button className="w-full" size="lg" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signup" ? "Already have an account?" : "New to Editing App?"}{" "}
        <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); setNotice(null); }}>
          {mode === "signup" ? "Sign in" : "Create one"}
        </button>
      </p>
    </div>
  );
}
