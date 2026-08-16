import { Clock3, Film, HardDrive, Sparkles } from "lucide-react";
import { ProjectHistory } from "@/components/project-history";
import { SetupRequired } from "@/components/setup-required";
import { UploadZone } from "@/components/upload-zone";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { getCreditSummary } from "@/lib/credits";
import { listProjects } from "@/lib/data/projects";
import { formatBytes, formatDuration } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "AI Clipper Workspace",
  robots: { index: false, follow: false },
};

export default async function ClipperPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const user = await getCurrentUser();
  const [projects, credits] = user
    ? await Promise.all([listProjects(), createClient().then(getCreditSummary)])
    : [[], null];
  const totalBytes = projects.reduce((sum, project) => sum + project.source_size_bytes, 0);
  const totalSeconds = projects.reduce((sum, project) => sum + Number(project.duration_seconds ?? 0), 0);
  const exported = projects.filter((project) => project.status === "completed").length;

  const metrics = [
    { icon: Film, label: "Sources", value: projects.length.toString(), detail: "Videos analyzed" },
    { icon: Clock3, label: "Footage", value: formatDuration(totalSeconds), detail: "Scanned for moments" },
    { icon: Sparkles, label: "Clips", value: exported.toString(), detail: "Ready exports" },
    { icon: HardDrive, label: "Imported", value: formatBytes(totalBytes), detail: "Private storage" },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section>
        <p className="text-sm font-medium text-primary">AI Clipper</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Turn long videos into the moments people watch.</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Paste a supported public video link or upload your own footage. AI Clipper transcribes it, ranks the strongest hooks, and prepares editable short clips with captions and social formats.</p>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">Private files · resumable uploads · durable jobs</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-border bg-card/70">
            <CardContent className="flex items-center gap-4 p-4 sm:p-5"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><metric.icon className="size-4" /></span><div><p className="text-xl font-semibold tracking-[-0.03em]">{metric.value}</p><p className="text-xs text-muted-foreground">{metric.label} · {metric.detail}</p></div></CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.45fr)]">
        <Card id="new-project" className="scroll-mt-24 border-border bg-card/70">
          <CardContent className="p-4 sm:p-6"><div className="mb-5"><h2 className="font-medium">Add a video source</h2><p className="mt-1 text-sm text-muted-foreground">Choose a file or paste a supported public link. Import begins only after login and subscription verification.</p></div><UploadZone hasPaidSubscription={credits?.active === true} isAuthenticated={Boolean(user)} /></CardContent>
        </Card>
        <Card className="border-border bg-card/70">
          <CardContent className="p-5 sm:p-6"><span className="mb-5 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-4" /></span><h2 className="font-medium">From source to short clip</h2><ol className="mt-5 space-y-4 text-sm text-muted-foreground"><li className="flex gap-3"><span className="font-mono text-xs text-primary">01</span><span>Securely import and inspect the video, speech, scenes, and pacing.</span></li><li className="flex gap-3"><span className="font-mono text-xs text-primary">02</span><span>Rank high-retention hooks and meaningful standalone moments.</span></li><li className="flex gap-3"><span className="font-mono text-xs text-primary">03</span><span>Select a moment, refine the range, add captions, and export for Shorts, Reels, or TikTok.</span></li></ol></CardContent>
        </Card>
      </section>

      <section><div className="mb-5 flex items-end justify-between"><div><h2 className="text-xl font-semibold tracking-[-0.025em]">Recent clip projects</h2><p className="mt-1 text-sm text-muted-foreground">{user ? "Continue selecting moments or download completed clips." : "Sign in to see your private clip history."}</p></div><span className="text-xs text-muted-foreground">{projects.length} total</span></div><ProjectHistory projects={projects} /></section>
    </main>
  );
}
