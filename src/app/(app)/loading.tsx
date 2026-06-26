import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <Spinner className="size-8 text-primary" />
    </div>
  );
}
