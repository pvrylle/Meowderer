import { createClient } from "@/lib/supabase/client";

export interface UploadedCapture {
  photoPath: string;
  stickerPath: string;
  stickerUrl: string;
}

/** Uploads the original + sticker to Supabase Storage under the user's folder. */
export async function uploadCapture(
  original: Blob,
  sticker: Blob,
): Promise<UploadedCapture> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be signed in.");

  const id = crypto.randomUUID();
  const photoPath = `${user.id}/${id}.jpg`;
  const stickerPath = `${user.id}/${id}.webp`;

  const photoUpload = await supabase.storage
    .from("captures")
    .upload(photoPath, original, { contentType: "image/jpeg", upsert: false });
  if (photoUpload.error) throw new Error(photoUpload.error.message);

  const stickerUpload = await supabase.storage
    .from("stickers")
    .upload(stickerPath, sticker, { contentType: "image/webp", upsert: false });
  if (stickerUpload.error) throw new Error(stickerUpload.error.message);

  const { data } = supabase.storage.from("stickers").getPublicUrl(stickerPath);
  return { photoPath, stickerPath, stickerUrl: data.publicUrl };
}
