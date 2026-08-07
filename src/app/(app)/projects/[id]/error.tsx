"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ProjectError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[70vh] place-items-center p-6"><Card className="max-w-md"><CardContent className="p-8 text-center"><span className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-destructive/10 text-red-300"><CircleAlert className="size-5" /></span><h2 className="font-semibold">The editor could not load</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">The signed media link or project data may have expired. Retry to refresh both.</p><Button className="mt-6" onClick={reset}><RotateCcw className="size-4" /> Try again</Button></CardContent></Card></div>
  );
}
