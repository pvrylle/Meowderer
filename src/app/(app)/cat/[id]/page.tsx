import { notFound } from "next/navigation";

import { getNamePollForCapture } from "@/app/(app)/cat/[id]/poll-actions";
import { CatDetailView } from "@/components/cat/cat-detail-view";
import { getCurrentUser } from "@/lib/auth";
import { getCapture } from "@/lib/captures";
import { getStrayCatSightings } from "@/lib/stray-cats";
import { createClient } from "@/lib/supabase/server";

export default async function CatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [capture, user] = await Promise.all([getCapture(id), getCurrentUser()]);
  if (!capture) notFound();

  const supabase = await createClient();
  const { data: uploader } = await supabase
    .from("profiles")
    .select("username, is_super_admin")
    .eq("id", capture.user_id)
    .maybeSingle();

  const { data: viewerProfile } = user
    ? await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const poll = await getNamePollForCapture(id);
  const album = capture.stray_cat_id
    ? await getStrayCatSightings(capture.stray_cat_id)
    : [];

  const { data: favoriteRow, error: favError } = user
    ? await supabase
        .from("user_cat_favorites")
        .select("capture_id")
        .eq("user_id", user.id)
        .eq("capture_id", capture.id)
        .maybeSingle()
    : { data: null, error: null };

  if (favError) {
    console.error("[CatDetailPage] favorites query error:", favError.message, favError.code);
  }

  return (
    <CatDetailView
      capture={capture}
      poll={poll}
      isOwner={user?.id === capture.user_id}
      uploaderUsername={uploader?.username ?? null}
      album={album.filter((s) => s.id !== capture.id)}
      isSuperAdmin={viewerProfile?.is_super_admin === true}
      nameLocked={Boolean(capture.name_locked_at)}
      isFavorited={favoriteRow !== null}
    />
  );
}
