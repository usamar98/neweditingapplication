import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-md text-center"><span className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><FileQuestion className="size-5" /></span><h1 className="text-2xl font-semibold tracking-tight">Project not found</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">It may have been deleted, or you may not have access to it.</p><Button asChild className="mt-6"><Link href="/dashboard"><ArrowLeft className="size-4" /> Back to dashboard</Link></Button></div></main>;
}
