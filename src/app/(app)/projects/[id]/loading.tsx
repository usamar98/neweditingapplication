import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <main className="mx-auto max-w-[1680px] space-y-4 px-4 py-6">
      <div className="flex justify-between"><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-72" /></div><Skeleton className="h-10 w-56" /></div>
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]"><Skeleton className="aspect-video w-full rounded-xl" /><Skeleton className="h-[560px] rounded-xl" /></div>
    </main>
  );
}
