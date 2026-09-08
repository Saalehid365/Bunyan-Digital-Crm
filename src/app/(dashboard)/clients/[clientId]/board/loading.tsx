import { Skeleton } from "@/components/ui/skeleton";

export default function ClientBoardLoading() {
  return (
    <div className="flex flex-1 gap-5 overflow-x-auto p-4 md:p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-72 shrink-0 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  );
}
