"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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
  const { error } = await supabase
    .from("captures")
    .update({ nickname: nickname || null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Could not rename this cat." };

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
    // Best-effort cleanup of storage objects.
    if (capture.photo_url) {
      await supabase.storage.from("captures").remove([capture.photo_url]);
    }
    const stickerPath = capture.sticker_url.split("/stickers/")[1];
    if (stickerPath) {
      await supabase.storage.from("stickers").remove([stickerPath]);
    }
    await supabase.from("captures").delete().eq("id", id).eq("user_id", user.id);
  }

  revalidatePath("/catdex");
  revalidatePath("/home");
  revalidatePath("/map");
  revalidatePath("/profile");
  redirect("/catdex");
}
