import { Skeleton } from "@/components/ui/skeleton";

export default function MissionsLoading() {
  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-12 w-14 rounded-lg" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 rounded-lg" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
