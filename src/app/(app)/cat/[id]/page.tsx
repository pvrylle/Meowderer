import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { InteractiveCaptureCard } from "@/components/interactive-capture-card";
import { ShareCaptureCard } from "@/components/share-capture-card";
import { CatName, DeleteCatButton } from "@/components/cat/cat-actions";
import { getCapture } from "@/lib/captures";

export default async function CatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const capture = await getCapture(id);
  if (!capture) notFound();

  return (
    <div className="flex flex-col gap-6 p-6 pb-28">
      <header className="flex items-center justify-between">
        <Link
          href="/catdex"
          aria-label="Back"
          className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </header>

      <div className="mx-auto w-full max-w-xs">
        <InteractiveCaptureCard capture={capture} />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tap card to flip · Rename
        </p>
        <CatName id={capture.id} initialName={capture.nickname} />
      </div>

      <ShareCaptureCard capture={capture} />

      <DeleteCatButton id={capture.id} />
    </div>
  );
}
