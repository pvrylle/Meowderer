import imageCompression from "browser-image-compression";

import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 800_000;

export type UploadedPostImage = {
  path: string;
  publicUrl: string;
};

/** Compress and upload a post image to Supabase Storage (post-images bucket). */
export async function uploadPostImage(file: File): Promise<UploadedPostImage> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const compressed = await imageCompression(file, {
    maxSizeMB: MAX_BYTES / 1_000_000,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/webp",
  });

  const id = crypto.randomUUID();
  const path = `${user.id}/${id}.webp`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, compressed, { contentType: "image/webp", upsert: false });

  if (error) throw new Error("Could not upload image.");

  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/** Upload profile avatar (avatars bucket). */
export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const compressed = await imageCompression(file, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 256,
    useWebWorker: true,
    fileType: "image/webp",
  });

  const path = `${user.id}/avatar.webp`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, compressed, { contentType: "image/webp", upsert: true });

  if (error) throw new Error("Could not upload avatar.");

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
