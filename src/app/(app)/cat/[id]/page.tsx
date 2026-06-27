import { notFound } from "next/navigation";

import { CatDetailView } from "@/components/cat/cat-detail-view";
import { getCapture } from "@/lib/captures";

export default async function CatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const capture = await getCapture(id);
  if (!capture) notFound();

  return <CatDetailView capture={capture} />;
}
