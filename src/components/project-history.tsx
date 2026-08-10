import Link from "next/link";
import { ArrowUpRight, FileVideo, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatBytes, formatDate, formatDuration } from "@/lib/format";
import type { ProjectListItem } from "@/lib/data/projects";

export function ProjectHistory({ projects }: { projects: ProjectListItem[] }) {
  if (projects.length === 0) {
    return (
      <Card className="border-dashed bg-card/45">
        <CardContent className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
          <span className="mb-4 grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground"><FolderOpen className="size-5" /></span>
          <p className="font-medium">No projects yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Your uploaded and exported videos will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className="rounded-xl border border-border bg-card/70 p-4 transition hover:border-primary/20 hover:bg-card">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><FileVideo className="size-4" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{project.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{project.source_filename}</p></div>
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-center justify-between"><StatusBadge status={project.status} /><span className="text-xs text-muted-foreground">{formatDate(project.updated_at)}</span></div>
          </Link>
        ))}
      </div>
      <Card className="hidden overflow-hidden border-border bg-card/70 md:block">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Project</TableHead><TableHead>Status</TableHead><TableHead>Duration</TableHead><TableHead>Size</TableHead><TableHead>Updated</TableHead><TableHead className="w-14" /></TableRow></TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><FileVideo className="size-4" /></span><div className="min-w-0"><p className="max-w-64 truncate text-sm font-medium">{project.name}</p><p className="max-w-64 truncate text-xs text-muted-foreground">{project.source_filename}</p></div></div></TableCell>
                <TableCell><StatusBadge status={project.status} /></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{project.duration_seconds ? formatDuration(project.duration_seconds) : "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatBytes(project.source_size_bytes)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(project.updated_at)}</TableCell>
                <TableCell><Button size="icon" variant="ghost" asChild><Link href={`/projects/${project.id}`} aria-label={`Open ${project.name}`}><ArrowUpRight className="size-4" /></Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
