"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  deleteCaptureAssets,
  deleteCaptureAssetsByUrls,
  isCloudinaryAssetUrl,
  isSupabaseStorageAsset,
} from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";
import { isDemoSession } from "@/lib/auth";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

const renameSchema = z.object({
  id: z.string().uuid(),
  nickname: z.string().trim().max(40),
});

export async function renameCapture(input: unknown): Promise<ActionResult> {
  if (await isDemoSession()) {
    return { success: false, error: "Demo mode — renames aren't saved." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const parsed = renameSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid name." };

  const { id, nickname } = parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  const { data: capture } = await supabase
    .from("captures")
    .select("name_locked_at, stray_cat_id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!capture) return { success: false, error: "Cat not found." };

  const isOwner = capture.user_id === user.id;
  const isAdmin = profile?.is_super_admin === true;

  if (!isOwner && !isAdmin) {
    return { success: false, error: "You cannot rename this cat." };
  }

  if (capture.name_locked_at && !isAdmin) {
    return { success: false, error: "This name is locked after the community poll." };
  }

  const { error } = await supabase
    .from("captures")
    .update({ nickname: nickname || null })
    .eq("id", id);

  if (error) return { success: false, error: "Could not rename this cat." };

  if (capture.stray_cat_id && isAdmin) {
    await supabase
      .from("stray_cats")
      .update({ canonical_name: nickname || null })
      .eq("id", capture.stray_cat_id);
  }

  revalidatePath(`/cat/${id}`);
  revalidatePath("/catdex");
  revalidatePath("/home");
  revalidatePath("/map");
  revalidatePath("/profile");
  return { success: true };
}

export async function deleteCapture(id: string): Promise<void> {
  if (await isDemoSession()) redirect("/catdex");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: capture } = await supabase
    .from("captures")
    .select("photo_url, sticker_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (capture) {
    if (isCloudinaryAssetUrl(capture.photo_url, user.id)) {
      await deleteCaptureAssetsByUrls(
        user.id,
        capture.photo_url,
        capture.sticker_url,
      ).catch(() => undefined);
    } else if (isSupabaseStorageAsset(capture.photo_url, user.id)) {
      if (capture.photo_url.startsWith(`${user.id}/`)) {
        await supabase.storage.from("captures").remove([capture.photo_url]);
      }
      const stickerPath = capture.sticker_url.split("/stickers/")[1];
      if (stickerPath) {
        await supabase.storage.from("stickers").remove([stickerPath]);
      }
    } else {
      await deleteCaptureAssets(user.id, id).catch(() => undefined);
    }

    await supabase.from("captures").delete().eq("id", id).eq("user_id", user.id);
  }

  revalidatePath("/catdex");
  revalidatePath("/home");
  revalidatePath("/map");
  revalidatePath("/profile");
  redirect("/catdex");
}
