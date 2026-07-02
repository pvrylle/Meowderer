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
import type { CatTraits, Rarity } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

const traitsSchema = z.object({
  chonk: z.number().int().min(1).max(5),
  shy: z.number().int().min(1).max(5),
  grumpy: z.number().int().min(1).max(5),
  floof: z.number().int().min(1).max(5),
});

const saveCaptureSchema = z.object({
  captureId: z.string().uuid(),
  photoUrl: z.string().url(),
  stickerUrl: z.string().url(),
  nickname: z.string().trim().max(40).optional().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  coat_type: z.enum(COAT_TYPES).optional().nullable(),
  rarity: z.enum(["common", "uncommon", "rare", "epic"]).optional().nullable(),
  stray_cat_id: z.string().uuid().optional().nullable(),
  image_embedding: z.array(z.number()).length(512).optional().nullable(),
  traits: traitsSchema.optional().nullable(),
  short_description: z.string().trim().max(100).optional().nullable(),
  share_photo: z.boolean().optional().default(false),
  share_location: z.boolean().optional().default(false),
});

export type SaveResult =
  | { success: true; id: string; newAchievements: Achievement[] }
  | { success: false; error: string };

function formatEmbedding(vec: number[] | null | undefined): number[] | null {
  if (!vec?.length) return null;
  return vec;
}

async function resolveStrayCatId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    stray_cat_id?: string | null;
    nickname?: string | null;
    lat: number;
    lng: number;
    place_label: string | null;
    stickerUrl: string;
    embedding: number[] | null;
  },
): Promise<string | null> {
  if (input.stray_cat_id) {
    const { data: existing } = await supabase
      .from("stray_cats")
      .select("id, sighting_count, primary_lat, primary_lng")
      .eq("id", input.stray_cat_id)
      .maybeSingle();

    if (existing) {
      const count = existing.sighting_count + 1;
      const lat =
        existing.primary_lat != null
          ? (existing.primary_lat * existing.sighting_count + input.lat) / count
          : input.lat;
      const lng =
        existing.primary_lng != null
          ? (existing.primary_lng * existing.sighting_count + input.lng) / count
          : input.lng;

      await supabase
        .from("stray_cats")
        .update({
          sighting_count: count,
          primary_lat: lat,
          primary_lng: lng,
          cover_sticker_url: input.stickerUrl,
          ...(input.embedding ? { image_embedding: input.embedding } : {}),
          ...(input.nickname ? { canonical_name: input.nickname } : {}),
        })
        .eq("id", input.stray_cat_id);

      return input.stray_cat_id;
    }
  }

  const { data: created, error } = await supabase
    .from("stray_cats")
    .insert({
      canonical_name: input.nickname,
      primary_lat: input.lat,
      primary_lng: input.lng,
      place_label: input.place_label,
      sighting_count: 1,
      cover_sticker_url: input.stickerUrl,
      image_embedding: input.embedding,
    })
    .select("id")
    .single();

  if (error || !created) return null;
  return created.id;
}

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
    stray_cat_id,
    image_embedding,
    traits,
    short_description,
    share_photo,
    share_location,
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

  const place = await reverseGeocode(lat, lng);
  const { city, country, place_label } = place;

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
    rarity = clientRarity ? maxRarity(clientRarity, withEpic) : withEpic;
  } else if (clientRarity) {
    rarity = clientRarity;
  }

  const embeddingStr = formatEmbedding(image_embedding ?? null);
  const resolvedStrayId = await resolveStrayCatId(supabase, {
    stray_cat_id,
    nickname,
    lat,
    lng,
    place_label,
    stickerUrl,
    embedding: embeddingStr,
  });

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
      stray_cat_id: resolvedStrayId,
      share_photo: share_photo ?? false,
      share_location: share_location ?? false,
      short_description: short_description?.trim() || null,
      traits: (traits as CatTraits) ?? null,
      image_embedding: embeddingStr,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { success: false, error: "Failed to save your cat." };
  }

  const newAchievements = await unlockAchievementsAfterSave(supabase, user.id, data);

  await progressMissionsAndBadgesAfterSave(supabase, user.id);
  await updateStreakOnSave(supabase, user.id);

  revalidatePath("/home");
  revalidatePath("/catdex");
  revalidatePath("/map");
  revalidatePath("/profile");
  revalidatePath("/missions");

  return { success: true, id: data.id, newAchievements };
}
