"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { syncMissionProgress } from "@/lib/missions";
import {
  assertCommunityWriteAccess,
  assertRateLimit,
  assertUrgentAlertAllowed,
  censorCommunityText,
  isAllowedPostImageUrl,
  validateCommunityText,
} from "@/lib/community-safety";
import { isDemoSession } from "@/lib/auth";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const postSchema = z.object({
  body: z.string().trim().min(1).max(500),
  category: z.enum(["sighting", "shelter", "rescue", "general"]).default("sighting"),
  imageUrl: z.string().url().optional().nullable(),
  imagePath: z.string().max(200).optional().nullable(),
  captureId: z.string().uuid().optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
});

const chatSchema = z.object({
  body: z.string().trim().min(1).max(500),
  channel: z
    .enum(["general", "cat_care", "rescue", "shelters"])
    .default("general"),
});

const commentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1).max(500),
});

async function rejectDemo() {
  if (await isDemoSession()) {
    return { success: false as const, error: "Not available in demo mode." };
  }
  return null;
}

export async function createPostAction(input: unknown) {
  const demo = await rejectDemo();
  if (demo) return demo;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const access = await assertCommunityWriteAccess(supabase, user.id, {
    requireGuidelines: true,
  });
  if (!access.ok) return { success: false as const, error: access.error };

  const rate = await assertRateLimit(supabase, user.id, "post");
  if (!rate.ok) return { success: false as const, error: rate.error };

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid post." };

  const textCheck = validateCommunityText(parsed.data.body, { allowLinks: false });
  if (!textCheck.ok) return { success: false as const, error: textCheck.error };

  let imageUrl = parsed.data.imageUrl ?? null;

  if (parsed.data.imagePath) {
    if (!parsed.data.imagePath.startsWith(`${user.id}/`)) {
      return { success: false as const, error: "Invalid image path." };
    }
    const { data } = supabase.storage
      .from("post-images")
      .getPublicUrl(parsed.data.imagePath);
    imageUrl = data.publicUrl;
  }

  if (
    imageUrl &&
    !isAllowedPostImageUrl(imageUrl, user.id, SUPABASE_URL)
  ) {
    return { success: false as const, error: "Image source not allowed." };
  }

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    body: censorCommunityText(parsed.data.body),
    category: parsed.data.category,
    image_url: imageUrl,
    capture_id: parsed.data.captureId ?? null,
    lat: parsed.data.lat ?? null,
    lng: parsed.data.lng ?? null,
  });

  if (error) return { success: false as const, error: "Could not post." };
  revalidatePath("/community");
  return { success: true as const };
}

export async function toggleLikeAction(postId: string) {
  const demo = await rejectDemo();
  if (demo) return demo;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) return { success: false as const, error: "Could not unlike post." };
  } else {
    const { error } = await supabase.from("post_likes").insert({
      post_id: postId,
      user_id: user.id,
    });
    if (error) return { success: false as const, error: "Could not like post." };
  }

  revalidatePath("/community");
  return { success: true as const };
}

export async function addCommentAction(input: unknown) {
  const demo = await rejectDemo();
  if (demo) return demo;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const access = await assertCommunityWriteAccess(supabase, user.id, {
    requireGuidelines: true,
  });
  if (!access.ok) return { success: false as const, error: access.error };

  const rate = await assertRateLimit(supabase, user.id, "comment");
  if (!rate.ok) return { success: false as const, error: rate.error };

  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid comment." };

  const textCheck = validateCommunityText(parsed.data.body, { allowLinks: false });
  if (!textCheck.ok) return { success: false as const, error: textCheck.error };

  const { error } = await supabase.from("post_comments").insert({
    post_id: parsed.data.postId,
    user_id: user.id,
    body: censorCommunityText(parsed.data.body),
  });

  if (error) return { success: false as const, error: "Could not comment." };

  revalidatePath("/community");
  return { success: true as const };
}

export async function sendChatAction(input: unknown) {
  const demo = await rejectDemo();
  if (demo) return demo;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const access = await assertCommunityWriteAccess(supabase, user.id, {
    requireGuidelines: true,
    requireChat: true,
  });
  if (!access.ok) return { success: false as const, error: access.error };

  const rate = await assertRateLimit(supabase, user.id, "chat");
  if (!rate.ok) return { success: false as const, error: rate.error };

  const parsed = chatSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid message." };

  const textCheck = validateCommunityText(parsed.data.body, { allowLinks: false });
  if (!textCheck.ok) return { success: false as const, error: textCheck.error };

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      user_id: user.id,
      body: censorCommunityText(parsed.data.body),
      channel: parsed.data.channel,
    })
    .select("id, channel, user_id, body, created_at, hidden_at")
    .single();

  if (error || !data) return { success: false as const, error: "Could not send message." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    success: true as const,
    message: {
      ...data,
      author_name: profile?.username ?? "Cat lover",
      author_avatar: profile?.avatar_url ?? null,
    },
  };
}

export async function getCommentsAction(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const { getPostComments } = await import("@/lib/community");
  const comments = await getPostComments(supabase, postId, user.id);
  return { success: true as const, comments };
}

export async function createAlertAction(input: unknown) {
  const demo = await rejectDemo();
  if (demo) return demo;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const access = await assertCommunityWriteAccess(supabase, user.id, {
    requireGuidelines: true,
  });
  if (!access.ok) return { success: false as const, error: access.error };

  const rate = await assertRateLimit(supabase, user.id, "alert");
  if (!rate.ok) return { success: false as const, error: rate.error };

  const schema = z.object({
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().max(500).optional(),
    urgent: z.boolean().default(false),
    lat: z.number().min(-90).max(90).optional().nullable(),
    lng: z.number().min(-180).max(180).optional().nullable(),
  });

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid alert." };

  const titleCheck = validateCommunityText(parsed.data.title, { allowLinks: false });
  if (!titleCheck.ok) return { success: false as const, error: titleCheck.error };

  if (parsed.data.body) {
    const bodyCheck = validateCommunityText(parsed.data.body, { allowLinks: false });
    if (!bodyCheck.ok) return { success: false as const, error: bodyCheck.error };
  }

  if (parsed.data.urgent) {
    const urgent = await assertUrgentAlertAllowed(supabase, user.id);
    if (!urgent.ok) return { success: false as const, error: urgent.error };
  }

  const { error } = await supabase.from("rescue_alerts").insert({
    user_id: user.id,
    title: censorCommunityText(parsed.data.title),
    body: parsed.data.body ? censorCommunityText(parsed.data.body) : null,
    urgent: parsed.data.urgent,
    lat: parsed.data.lat ?? null,
    lng: parsed.data.lng ?? null,
  });

  if (error) return { success: false as const, error: "Could not create alert." };
  revalidatePath("/community");
  revalidatePath("/community/alerts");
  return { success: true as const };
}

export async function updateAvatarAction(avatarUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  if (!avatarUrl.startsWith("http")) {
    return { success: false as const, error: "Invalid avatar URL." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { success: false as const, error: "Could not update profile." };
  revalidatePath("/community");
  revalidatePath("/profile");
  revalidatePath("/settings");
  return { success: true as const };
}

const shelterVisitSchema = z.object({
  osmId: z.string().trim().min(1).max(80),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  name: z.string().trim().max(120).optional().nullable(),
});

export async function recordShelterVisitAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const parsed = shelterVisitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid check-in." };
  }

  const { error } = await supabase.from("user_shelter_visits").upsert(
    {
      user_id: user.id,
      osm_id: parsed.data.osmId,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      name: parsed.data.name ?? null,
      visited_at: new Date().toISOString(),
    },
    { onConflict: "user_id,osm_id" },
  );

  if (error) return { success: false as const, error: "Could not record visit." };

  await syncMissionProgress(supabase, user.id);

  revalidatePath("/missions");
  revalidatePath("/map");
  return { success: true as const, firstVisit: true as const };
}

export async function resolveAlertAction(alertId: string) {
  const demo = await rejectDemo();
  if (demo) return demo;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const { data: alert } = await supabase
    .from("rescue_alerts")
    .select("id, user_id, resolved")
    .eq("id", alertId)
    .maybeSingle();

  if (!alert) return { success: false as const, error: "Alert not found." };
  if (alert.resolved) {
    return { success: false as const, error: "Already resolved." };
  }
  if (alert.user_id === user.id) {
    return {
      success: false as const,
      error: "Ask another community member to verify your alert.",
    };
  }

  const { error } = await supabase
    .from("rescue_alerts")
    .update({
      resolved: true,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", alertId);

  if (error) return { success: false as const, error: "Could not resolve alert." };

  await syncMissionProgress(supabase, user.id);

  revalidatePath("/community");
  revalidatePath("/community/alerts");
  revalidatePath("/missions");
  return { success: true as const };
}
