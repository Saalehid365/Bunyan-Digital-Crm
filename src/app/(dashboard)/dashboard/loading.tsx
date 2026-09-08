import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-56 lg:col-span-3" />
        <Skeleton className="h-56 lg:col-span-2" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
