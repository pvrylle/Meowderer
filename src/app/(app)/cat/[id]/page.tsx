import { notFound } from "next/navigation";

import { getNamePollForCapture } from "@/app/(app)/cat/[id]/poll-actions";
import { CatDetailView } from "@/components/cat/cat-detail-view";
import { getCurrentUser } from "@/lib/auth";
import { getCapture } from "@/lib/captures";

export default async function CatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [capture, user] = await Promise.all([getCapture(id), getCurrentUser()]);
  if (!capture) notFound();

  const poll = await getNamePollForCapture(id);

  return (
    <CatDetailView
      capture={capture}
      poll={poll}
      isOwner={user?.id === capture.user_id}
    />
  );
}
