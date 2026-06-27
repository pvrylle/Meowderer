import "server-only";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary(): void {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }

  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function uploadBuffer(
  buffer: Buffer,
  publicId: string,
  options: Record<string, unknown> = {},
): Promise<UploadApiResponse> {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
        ...options,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export function captureAssetPrefix(userId: string, captureId: string): string {
  return `catdex/${userId}/${captureId}`;
}

export function isCloudinaryAssetUrl(url: string, userId: string): boolean {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud || !url.startsWith("http")) return false;
  try {
    const host = new URL(url).hostname;
    return (
      host === "res.cloudinary.com" &&
      url.includes(`/catdex/${userId}/`)
    );
  } catch {
    return false;
  }
}

/** Legacy Supabase Storage path or URL (pre-Cloudinary). */
export function isSupabaseStorageAsset(
  value: string,
  userId: string,
): boolean {
  if (value.startsWith(`${userId}/`)) return true;
  return value.includes("/storage/v1/object/public/stickers/");
}

export async function uploadCaptureImages(
  userId: string,
  captureId: string,
  original: Buffer,
  sticker: Buffer,
): Promise<{ photoUrl: string; stickerUrl: string }> {
  const prefix = captureAssetPrefix(userId, captureId);

  const [photo, stickerResult] = await Promise.all([
    uploadBuffer(original, `${prefix}/original`, {
      type: "authenticated",
    }),
    uploadBuffer(sticker, `${prefix}/sticker`, {
      format: "webp",
    }),
  ]);

  return {
    photoUrl: photo.secure_url,
    stickerUrl: stickerResult.secure_url,
  };
}

export async function deleteCaptureAssets(
  userId: string,
  captureId: string,
): Promise<void> {
  if (!isCloudinaryConfigured()) return;
  configureCloudinary();

  const prefix = captureAssetPrefix(userId, captureId);

  await Promise.all([
    cloudinary.api.delete_resources_by_prefix(prefix, {
      resource_type: "image",
      type: "upload",
    }),
    cloudinary.api.delete_resources_by_prefix(prefix, {
      resource_type: "image",
      type: "authenticated",
    }),
  ]);
}

export async function deleteCaptureAssetsByUrls(
  userId: string,
  photoUrl: string,
  _stickerUrl: string,
): Promise<void> {
  if (!isCloudinaryAssetUrl(photoUrl, userId)) return;

  const match = photoUrl.match(/\/catdex\/[^/]+\/([0-9a-f-]{36})\//i);
  const captureId = match?.[1];
  if (!captureId) return;

  await deleteCaptureAssets(userId, captureId);
}
