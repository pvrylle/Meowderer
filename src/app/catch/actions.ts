"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { isDemoSession } from "@/lib/auth";

const saveCaptureSchema = z.object({
  photoPath: z.string().min(1).max(200),
  stickerPath: z.string().min(1).max(200),
  stickerUrl: z.string().url(),
  nickname: z.string().trim().max(40).optional().nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
});

export type SaveResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function saveCapture(input: unknown): Promise<SaveResult> {
  if (await isDemoSession()) {
    return { success: false, error: "Demo mode — sign in to save cats." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const parsed = saveCaptureSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const { photoPath, stickerPath, stickerUrl, nickname, lat, lng } = parsed.data;

  // Defense in depth: uploaded files must live under the user's own folder.
  if (
    !photoPath.startsWith(`${user.id}/`) ||
    !stickerPath.startsWith(`${user.id}/`)
  ) {
    return { success: false, error: "Invalid file path." };
  }

  const { data, error } = await supabase
    .from("captures")
    .insert({
      user_id: user.id,
      photo_url: photoPath,
      sticker_url: stickerUrl,
      nickname: nickname?.trim() || null,
      lat,
      lng,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Failed to save your cat." };
  }

  revalidatePath("/home");
  revalidatePath("/catdex");
  return { success: true, id: data.id };
}
