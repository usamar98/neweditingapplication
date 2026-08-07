import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Film, ShieldCheck, Sparkles } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { Brand } from "@/components/brand";
import { SetupRequired } from "@/components/setup-required";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (!isSupabaseConfigured()) {
    return <SetupRequired />;
  }
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden border-r border-white/[0.06] bg-black/10 p-10 lg:flex lg:flex-col">
        <div className="surface-grid pointer-events-none absolute inset-0" />
        <Brand className="relative z-10" />
        <div className="relative z-10 my-auto max-w-xl">
          <span className="mb-7 grid size-12 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary"><Film className="size-5" /></span>
          <h2 className="text-balance text-4xl font-semibold tracking-[-0.045em] xl:text-5xl">From raw footage to a clear first cut.</h2>
          <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">Upload securely, let the worker analyze the hard parts, and finish the edit in one focused workspace.</p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 text-sm"><ShieldCheck className="size-4 text-primary" /> Private files and signed access</div>
            <div className="flex items-center gap-3 text-sm"><Sparkles className="size-4 text-primary" /> AI suggestions stay editable</div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-muted-foreground">Durable processing. Realtime progress. Production-ready exports.</p>
      </section>
      <section className="flex min-h-screen flex-col p-5 sm:p-8">
        <div className="flex items-center justify-between lg:justify-end">
          <Brand className="lg:hidden" />
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Back home</Link>
        </div>
        <div className="my-auto flex justify-center py-12">
          <Card className="w-full max-w-md border-white/[0.08] bg-card/85 shadow-2xl shadow-black/30">
            <CardContent className="p-6 sm:p-8">
              <Suspense fallback={<div className="h-[420px] animate-pulse rounded-xl bg-muted" />}>
                <AuthForm />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
