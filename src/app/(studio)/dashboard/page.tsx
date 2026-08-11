import { Clock3, Film, HardDrive, Sparkles } from "lucide-react";
import { ProjectHistory } from "@/components/project-history";
import { SetupRequired } from "@/components/setup-required";
import { UploadZone } from "@/components/upload-zone";
import { Card, CardContent } from "@/components/ui/card";
import { WelcomeCreditsCard } from "@/components/welcome-credits-card";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { getCreditSummary } from "@/lib/credits";
import { listProjects } from "@/lib/data/projects";
import { formatBytes, formatDuration } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "AI Video Editor Workspace",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const user = await getCurrentUser();
  const [projects, credits] = user
    ? await Promise.all([
        listProjects(),
        createClient().then(getCreditSummary),
      ])
    : [[], null];
  const totalBytes = projects.reduce((sum, project) => sum + project.source_size_bytes, 0);
  const totalSeconds = projects.reduce((sum, project) => sum + Number(project.duration_seconds ?? 0), 0);
  const exported = projects.filter((project) => project.status === "completed").length;

  const metrics = [
    { icon: Film, label: "Projects", value: projects.length.toString(), detail: "All video work" },
    { icon: Clock3, label: "Footage", value: formatDuration(totalSeconds), detail: "Analyzed duration" },
    { icon: Sparkles, label: "Exports", value: exported.toString(), detail: "Production MP4s" },
    { icon: HardDrive, label: "Uploaded", value: formatBytes(totalBytes), detail: "Private storage" },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section>
        <p className="text-sm font-medium text-primary">Creative workspace</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Make the next cut.</h1><p className="mt-2 text-sm text-muted-foreground">Explore the complete editor, then sign in and choose a plan when you upload footage.</p></div>
          <p className="text-xs text-muted-foreground">Private files · resumable uploads · realtime jobs</p>
        </div>
      </section>

      <WelcomeCreditsCard credits={credits} isAuthenticated={Boolean(user)} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-border bg-card/70">
            <CardContent className="flex items-center gap-4 p-4 sm:p-5"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><metric.icon className="size-4" /></span><div><p className="text-xl font-semibold tracking-[-0.03em]">{metric.value}</p><p className="text-xs text-muted-foreground">{metric.label} · {metric.detail}</p></div></CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.5fr)]">
        <Card id="new-project" className="scroll-mt-24 border-border bg-card/70">
          <CardContent className="p-4 sm:p-6"><div className="mb-5"><h2 className="font-medium">New video project</h2><p className="mt-1 text-sm text-muted-foreground">Your upload starts only after login and active-subscription verification.</p></div><UploadZone hasPaidSubscription={credits?.active === true} isAuthenticated={Boolean(user)} /></CardContent>
        </Card>
        <Card className="border-border bg-card/70">
          <CardContent className="p-5 sm:p-6"><span className="mb-5 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-4" /></span><h2 className="font-medium">What happens next</h2><ol className="mt-5 space-y-4 text-sm text-muted-foreground"><li className="flex gap-3"><span className="font-mono text-xs text-primary">01</span><span>FFmpeg safely probes the video and detects scene changes and silence.</span></li><li className="flex gap-3"><span className="font-mono text-xs text-primary">02</span><span>The configured AI adapters transcribe speech and rank key moments.</span></li><li className="flex gap-3"><span className="font-mono text-xs text-primary">03</span><span>The editor opens with captions, clean-up suggestions, and format controls.</span></li></ol></CardContent>
        </Card>
      </section>

      <section><div className="mb-5 flex items-end justify-between"><div><h2 className="text-xl font-semibold tracking-[-0.025em]">Recent projects</h2><p className="mt-1 text-sm text-muted-foreground">{user ? "Continue editing or download completed exports." : "Sign in to see your private project history."}</p></div><span className="text-xs text-muted-foreground">{projects.length} total</span></div><ProjectHistory projects={projects} /></section>
    </main>
  );
}
