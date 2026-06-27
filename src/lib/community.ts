import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChatMessage, Post, RescueAlert } from "@/lib/supabase/types";
import type { Database } from "@/lib/supabase/types";

type Supabase = SupabaseClient<Database>;

export type PostWithAuthor = Post & {
  author_name: string;
  liked_by_me: boolean;
};

export async function getPosts(supabase: Supabase, userId: string): Promise<PostWithAuthor[]> {
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!posts?.length) return [];

  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.username ?? "Cat lover"]),
  );

  const { data: likes } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId);

  const likedIds = new Set((likes ?? []).map((l) => l.post_id));

  return posts.map((p) => ({
    ...p,
    author_name: nameById.get(p.user_id) ?? "Cat lover",
    liked_by_me: likedIds.has(p.id),
  }));
}

export async function getRescueAlerts(
  supabase: Supabase,
): Promise<RescueAlert[]> {
  const { data } = await supabase
    .from("rescue_alerts")
    .select("*")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getChatMessages(
  supabase: Supabase,
  channel: string,
): Promise<(ChatMessage & { author_name: string })[]> {
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("channel", channel)
    .order("created_at", { ascending: true })
    .limit(100);

  if (!messages?.length) return [];

  const userIds = [...new Set(messages.map((m) => m.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.username ?? "Cat lover"]),
  );

  return messages.map((m) => ({
    ...m,
    author_name: nameById.get(m.user_id) ?? "Cat lover",
  }));
}

export async function countUrgentAlerts(supabase: Supabase): Promise<number> {
  const { count } = await supabase
    .from("rescue_alerts")
    .select("*", { count: "exact", head: true })
    .eq("resolved", false)
    .eq("urgent", true);
  return count ?? 0;
}
