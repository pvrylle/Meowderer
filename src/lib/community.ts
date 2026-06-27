import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChatMessage, Post, RescueAlert } from "@/lib/supabase/types";
import type { Database } from "@/lib/supabase/types";

type Supabase = SupabaseClient<Database>;

export type PostWithAuthor = Post & {
  author_name: string;
  author_avatar: string | null;
  liked_by_me: boolean;
};

export type CommentWithAuthor = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
};

export type ChatMessageWithAuthor = ChatMessage & {
  author_name: string;
  author_avatar: string | null;
};

async function profileMap(
  supabase: Supabase,
  userIds: string[],
): Promise<Map<string, { name: string; avatar: string | null }>> {
  if (userIds.length === 0) return new Map();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  return new Map(
    (profiles ?? []).map((p) => [
      p.id,
      { name: p.username ?? "Cat lover", avatar: p.avatar_url },
    ]),
  );
}

export async function getPosts(
  supabase: Supabase,
  userId: string,
): Promise<PostWithAuthor[]> {
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!posts?.length) return [];

  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const names = await profileMap(supabase, userIds);

  const { data: likes } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId);

  const likedIds = new Set((likes ?? []).map((l) => l.post_id));

  return posts.map((p) => {
    const author = names.get(p.user_id);
    return {
      ...p,
      author_name: author?.name ?? "Cat lover",
      author_avatar: author?.avatar ?? null,
      liked_by_me: likedIds.has(p.id),
    };
  });
}

export async function getPostComments(
  supabase: Supabase,
  postId: string,
): Promise<CommentWithAuthor[]> {
  const { data: comments } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (!comments?.length) return [];

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const names = await profileMap(supabase, userIds);

  return comments.map((c) => {
    const author = names.get(c.user_id);
    return {
      ...c,
      author_name: author?.name ?? "Cat lover",
      author_avatar: author?.avatar ?? null,
    };
  });
}

export async function getRescueAlerts(
  supabase: Supabase,
): Promise<RescueAlert[]> {
  const { data } = await supabase
    .from("rescue_alerts")
    .select("*")
    .eq("resolved", false)
    .order("urgent", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getChatMessages(
  supabase: Supabase,
  channel: string,
): Promise<ChatMessageWithAuthor[]> {
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("channel", channel)
    .order("created_at", { ascending: true })
    .limit(100);

  if (!messages?.length) return [];

  const userIds = [...new Set(messages.map((m) => m.user_id))];
  const names = await profileMap(supabase, userIds);

  return messages.map((m) => {
    const author = names.get(m.user_id);
    return {
      ...m,
      author_name: author?.name ?? "Cat lover",
      author_avatar: author?.avatar ?? null,
    };
  });
}

export async function countUrgentAlerts(supabase: Supabase): Promise<number> {
  const { count } = await supabase
    .from("rescue_alerts")
    .select("*", { count: "exact", head: true })
    .eq("resolved", false)
    .eq("urgent", true);
  return count ?? 0;
}
