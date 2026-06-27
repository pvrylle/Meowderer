"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const postSchema = z.object({
  body: z.string().trim().min(1).max(500),
  category: z.enum(["sighting", "shelter", "rescue", "general"]).default("sighting"),
  imageUrl: z.string().url().optional().nullable(),
  imagePath: z.string().max(200).optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
});

const chatSchema = z.object({
  body: z.string().trim().min(1).max(500),
  channel: z.string().trim().min(1).max(40).default("general"),
});

const commentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1).max(500),
});

export async function createPostAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid post." };

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

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    body: parsed.data.body,
    category: parsed.data.category,
    image_url: imageUrl,
    lat: parsed.data.lat ?? null,
    lng: parsed.data.lng ?? null,
  });

  if (error) return { success: false as const, error: "Could not post." };
  revalidatePath("/community");
  return { success: true as const };
}

export async function toggleLikeAction(postId: string) {
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
    await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    const { data: post } = await supabase
      .from("posts")
      .select("likes_count")
      .eq("id", postId)
      .single();
    if (post) {
      await supabase
        .from("posts")
        .update({ likes_count: Math.max(0, post.likes_count - 1) })
        .eq("id", postId);
    }
  } else {
    await supabase.from("post_likes").insert({
      post_id: postId,
      user_id: user.id,
    });
    const { data: post } = await supabase
      .from("posts")
      .select("likes_count")
      .eq("id", postId)
      .single();
    if (post) {
      await supabase
        .from("posts")
        .update({ likes_count: post.likes_count + 1 })
        .eq("id", postId);
    }
  }

  revalidatePath("/community");
  return { success: true as const };
}

export async function addCommentAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid comment." };

  const { error } = await supabase.from("post_comments").insert({
    post_id: parsed.data.postId,
    user_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { success: false as const, error: "Could not comment." };

  const { data: post } = await supabase
    .from("posts")
    .select("comments_count")
    .eq("id", parsed.data.postId)
    .single();

  if (post) {
    await supabase
      .from("posts")
      .update({ comments_count: post.comments_count + 1 })
      .eq("id", parsed.data.postId);
  }

  revalidatePath("/community");
  return { success: true as const };
}

export async function sendChatAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const parsed = chatSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid message." };

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      user_id: user.id,
      body: parsed.data.body,
      channel: parsed.data.channel,
    })
    .select("id, channel, user_id, body, created_at")
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
  const comments = await getPostComments(supabase, postId);
  return { success: true as const, comments };
}

export async function createAlertAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const schema = z.object({
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().max(500).optional(),
    urgent: z.boolean().default(false),
    lat: z.number().min(-90).max(90).optional().nullable(),
    lng: z.number().min(-180).max(180).optional().nullable(),
  });

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid alert." };

  const { error } = await supabase.from("rescue_alerts").insert({
    user_id: user.id,
    title: parsed.data.title,
    body: parsed.data.body ?? null,
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
