import { NextResponse } from "next/server";

import {
  assertCommunityWriteAccess,
  assertRateLimit,
  isWebImageBuffer,
} from "@/lib/community-safety";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 900_000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const access = await assertCommunityWriteAccess(supabase, user.id, {
    requireGuidelines: true,
  });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const rate = await assertRateLimit(supabase, user.id, "upload");
  if (!rate.ok) {
    return NextResponse.json({ error: rate.error }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const fileField = formData.get("image");
  if (!(fileField instanceof Blob)) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }

  if (fileField.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image file too large." }, { status: 413 });
  }

  const buffer = Buffer.from(await fileField.arrayBuffer());
  if (!isWebImageBuffer(buffer)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WebP images are allowed." },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  const path = `${user.id}/${id}.webp`;
  const contentType =
    buffer.toString("ascii", 0, 4) === "RIFF" ? "image/webp" : fileField.type || "image/jpeg";

  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, buffer, { contentType, upsert: false });

  if (error) {
    return NextResponse.json({ error: "Could not upload image." }, { status: 500 });
  }

  const { data } = supabase.storage.from("post-images").getPublicUrl(path);

  return NextResponse.json({
    path,
    publicUrl: data.publicUrl,
  });
}
