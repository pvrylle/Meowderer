"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const postSchema = z.object({
  body: z.string().trim().min(1).max(500),
  category: z.enum(["sighting", "shelter", "rescue", "general"]).default("sighting"),
});

const chatSchema = z.object({
  body: z.string().trim().min(1).max(500),
  channel: z.string().trim().min(1).max(40).default("general"),
});

export async function createPostAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid post." };

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    body: parsed.data.body,
    category: parsed.data.category,
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

export async function sendChatAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const parsed = chatSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid message." };

  const { error } = await supabase.from("chat_messages").insert({
    user_id: user.id,
    body: parsed.data.body,
    channel: parsed.data.channel,
  });

  if (error) return { success: false as const, error: "Could not send message." };
  revalidatePath("/community");
  return { success: true as const };
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
  });

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid alert." };

  const { error } = await supabase.from("rescue_alerts").insert({
    user_id: user.id,
    title: parsed.data.title,
    body: parsed.data.body ?? null,
    urgent: parsed.data.urgent,
  });

  if (error) return { success: false as const, error: "Could not create alert." };
  revalidatePath("/community");
  return { success: true as const };
}
