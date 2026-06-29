import { Skeleton } from "@/components/ui/skeleton";

export default function CatDetailLoading() {
  return (
    <div className="flex flex-col gap-5 px-5 pt-4">
      <div className="flex items-center justify-between">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      <div className="flex justify-center py-6">
        <Skeleton className="aspect-[5/7] w-52 rounded-2xl" />
      </div>
      <div className="space-y-3 text-center">
        <Skeleton className="mx-auto h-6 w-32" />
        <Skeleton className="mx-auto h-4 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}
