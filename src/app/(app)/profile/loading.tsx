import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      <div className="flex flex-col items-center">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="mt-3 h-5 w-40" />
        <Skeleton className="mt-1 h-4 w-24" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    </div>
  );
}
