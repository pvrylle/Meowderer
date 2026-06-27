export interface UploadedCapture {
  captureId: string;
  photoUrl: string;
  stickerUrl: string;
}

/** Upload original + sticker to Cloudinary via the authenticated API route. */
export async function uploadCapture(
  original: Blob,
  sticker: Blob,
): Promise<UploadedCapture> {
  const formData = new FormData();
  formData.append("original", original, "original.jpg");
  formData.append("sticker", sticker, "sticker.webp");

  const res = await fetch("/api/captures/upload", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json()) as {
    captureId?: string;
    photoUrl?: string;
    stickerUrl?: string;
    error?: string;
  };

  if (!res.ok || !data.captureId || !data.photoUrl || !data.stickerUrl) {
    throw new Error(data.error ?? "Failed to upload images.");
  }

  return {
    captureId: data.captureId,
    photoUrl: data.photoUrl,
    stickerUrl: data.stickerUrl,
  };
}
