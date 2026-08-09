import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3"><Skeleton className="h-6 w-28" /><Skeleton className="h-10 w-80 max-w-full" /><Skeleton className="h-5 w-[520px] max-w-full" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}</div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.65fr_0.75fr]"><Skeleton className="h-96 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>
      <Skeleton className="mt-4 h-[520px] rounded-xl" />
    </main>
  );
}
