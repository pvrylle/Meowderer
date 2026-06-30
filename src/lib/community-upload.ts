import imageCompression from "browser-image-compression";

export type UploadedPostImage = {
  path: string;
  publicUrl: string;
};

/** Compress and upload a post image via the validated server route. */
export async function uploadPostImage(file: File): Promise<UploadedPostImage> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/webp",
  });

  const formData = new FormData();
  formData.append("image", compressed, "post.webp");

  const response = await fetch("/api/community/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as {
    path?: string;
    publicUrl?: string;
    error?: string;
  };

  if (!response.ok || !payload.path || !payload.publicUrl) {
    throw new Error(payload.error ?? "Could not upload image.");
  }

  return { path: payload.path, publicUrl: payload.publicUrl };
}

/** Upload profile avatar (avatars bucket). */
export async function uploadAvatar(file: File): Promise<string> {
  const { createClient } = await import("@/lib/supabase/client");
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
