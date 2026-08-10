import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-[calc(100vh-4rem)] place-items-center p-6"><div className="max-w-md text-center"><span className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><FileQuestion className="size-5" /></span><h1 className="text-2xl font-semibold tracking-tight">Page not found</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">The address may have changed, or the page may no longer exist.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild><Link href="/"><ArrowLeft className="size-4" /> Back to homepage</Link></Button><Button variant="outline" asChild><Link href={"/features" as Route}>Explore features</Link></Button></div></div></main>;
}
