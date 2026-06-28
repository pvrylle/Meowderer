"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { unlockAchievementsAfterSave, type Achievement } from "@/lib/achievements";
import { isCloudinaryAssetUrl } from "@/lib/cloudinary";
import { progressMissionsAndBadgesAfterSave } from "@/lib/missions";
import { applyLocationEpicBonus, COAT_TYPES, coatToRarity, maxRarity } from "@/lib/coat-rarity";
import { reverseGeocode } from "@/lib/geocode";
import { isDemoSession } from "@/lib/auth";
import { updateStreakOnSave } from "@/lib/retention";
import type { Rarity } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

const saveCaptureSchema = z.object({
  captureId: z.string().uuid(),
  photoUrl: z.string().url(),
  stickerUrl: z.string().url(),
  nickname: z.string().trim().max(40).optional().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  coat_type: z.enum(COAT_TYPES).optional().nullable(),
  rarity: z.enum(["common", "uncommon", "rare", "epic"]).optional().nullable(),
});

export type SaveResult =
  | { success: true; id: string; newAchievements: Achievement[] }
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

  const {
    captureId,
    photoUrl,
    stickerUrl,
    nickname,
    lat,
    lng,
    coat_type,
    rarity: clientRarity,
  } = parsed.data;

  if (
    !isCloudinaryAssetUrl(photoUrl, user.id) ||
    !isCloudinaryAssetUrl(stickerUrl, user.id)
  ) {
    return { success: false, error: "Invalid image URLs." };
  }

  if (
    !photoUrl.includes(`/${captureId}/`) ||
    !stickerUrl.includes(`/${captureId}/`)
  ) {
    return { success: false, error: "Capture ID does not match uploaded images." };
  }

  let city: string | null = null;
  let country: string | null = null;
  let place_label: string | null = null;

  const place = await reverseGeocode(lat, lng);
  city = place.city;
  country = place.country;
  place_label = place.place_label;

  const { data: existingCaptures } = await supabase
    .from("captures")
    .select("city, country")
    .eq("user_id", user.id);

  const existingCities = new Set(
    (existingCaptures ?? [])
      .map((c) => c.city)
      .filter((c): c is string => Boolean(c)),
  );
  const existingCountries = new Set(
    (existingCaptures ?? [])
      .map((c) => c.country)
      .filter((c): c is string => Boolean(c)),
  );

  const normalizedCoat = coat_type?.trim() || null;
  let rarity: Rarity | null = null;

  if (normalizedCoat) {
    const base = coatToRarity(normalizedCoat);
    const withEpic = applyLocationEpicBonus(
      base,
      city,
      country,
      existingCities,
      existingCountries,
    );
    rarity = clientRarity
      ? maxRarity(clientRarity, withEpic)
      : withEpic;
  } else if (clientRarity) {
    rarity = clientRarity;
  }

  const { data, error } = await supabase
    .from("captures")
    .insert({
      id: captureId,
      user_id: user.id,
      photo_url: photoUrl,
      sticker_url: stickerUrl,
      nickname: nickname?.trim() || null,
      lat,
      lng,
      city,
      country,
      place_label,
      coat_type: normalizedCoat,
      rarity,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { success: false, error: "Failed to save your cat." };
  }

  const newAchievements = await unlockAchievementsAfterSave(
    supabase,
    user.id,
    data,
  );

  await progressMissionsAndBadgesAfterSave(supabase, user.id);
  await updateStreakOnSave(supabase, user.id);

  revalidatePath("/home");
  revalidatePath("/catdex");
  revalidatePath("/map");
  revalidatePath("/profile");
  revalidatePath("/missions");

  return { success: true, id: data.id, newAchievements };
}
