import { NextResponse } from "next/server";

import {
  isCloudinaryConfigured,
  uploadCaptureImages,
} from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_ORIGINAL_BYTES = 1_200_000;
const MAX_STICKER_BYTES = 600_000;

export async function POST(request: Request) {
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Image uploads are not configured." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const originalField = formData.get("original");
  const stickerField = formData.get("sticker");

  if (!(originalField instanceof Blob) || !(stickerField instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing original or sticker image." },
      { status: 400 },
    );
  }

  if (originalField.size > MAX_ORIGINAL_BYTES || stickerField.size > MAX_STICKER_BYTES) {
    return NextResponse.json({ error: "Image file too large." }, { status: 413 });
  }

  const captureId = crypto.randomUUID();
  const original = Buffer.from(await originalField.arrayBuffer());
  const sticker = Buffer.from(await stickerField.arrayBuffer());

  try {
    const { photoUrl, stickerUrl } = await uploadCaptureImages(
      user.id,
      captureId,
      original,
      sticker,
    );

    return NextResponse.json({
      captureId,
      photoUrl,
      stickerUrl,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to upload images." },
      { status: 500 },
    );
  }
}
