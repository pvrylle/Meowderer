import { Skeleton } from "@/components/ui/skeleton";

export default function CatDexLoading() {
  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-14 rounded-lg" />
      </div>
      <Skeleton className="h-24 rounded-2xl" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="aspect-[5/7] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
