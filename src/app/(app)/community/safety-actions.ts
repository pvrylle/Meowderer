"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ReportReason } from "@/content/community-guidelines";
import { isDemoSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const reportSchema = z.object({
  contentType: z.enum([
    "post",
    "comment",
    "chat_message",
    "rescue_alert",
    "user",
  ]),
  contentId: z.string().min(1).max(80),
  reportedUserId: z.string().uuid().optional().nullable(),
  reason: z.enum([
    "harassment",
    "spam",
    "inappropriate",
    "false_alert",
    "other",
  ]),
  details: z.string().trim().max(500).optional().nullable(),
});

export async function acceptCommunityGuidelinesAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (await isDemoSession()) {
    return { success: false, error: "Not available in demo mode." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ community_guidelines_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/community");
  return { success: true };
}

export async function createReportAction(input: unknown): Promise<{
  success: boolean;
  error?: string;
}> {
  if (await isDemoSession()) {
    return { success: false, error: "Not available in demo mode." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid report." };
  }

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    content_type: parsed.data.contentType,
    content_id: parsed.data.contentId,
    reported_user_id: parsed.data.reportedUserId ?? null,
    reason: parsed.data.reason as ReportReason,
    details: parsed.data.details ?? null,
  });

  if (error) return { success: false, error: "Could not submit report." };
  return { success: true };
}

export async function blockUserAction(blockedId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (await isDemoSession()) {
    return { success: false, error: "Not available in demo mode." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };
  if (blockedId === user.id) {
    return { success: false, error: "You cannot block yourself." };
  }

  const { error } = await supabase.from("user_blocks").upsert({
    blocker_id: user.id,
    blocked_id: blockedId,
  });

  if (error) return { success: false, error: "Could not block user." };
  revalidatePath("/community");
  return { success: true };
}

export async function deletePostAction(postId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (await isDemoSession()) {
    return { success: false, error: "Not available in demo mode." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id, image_url")
    .eq("id", postId)
    .maybeSingle();

  if (!post || post.user_id !== user.id) {
    return { success: false, error: "Post not found." };
  }

  if (post.image_url?.includes("/post-images/")) {
    const marker = "/post-images/";
    const idx = post.image_url.indexOf(marker);
    if (idx !== -1) {
      const path = decodeURIComponent(post.image_url.slice(idx + marker.length));
      await supabase.storage.from("post-images").remove([path]);
    }
  }

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { success: false, error: "Could not delete post." };

  revalidatePath("/community");
  return { success: true };
}

export async function deleteCommentAction(commentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (await isDemoSession()) {
    return { success: false, error: "Not available in demo mode." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const { data: comment } = await supabase
    .from("post_comments")
    .select("id, user_id, post_id")
    .eq("id", commentId)
    .maybeSingle();

  if (!comment || comment.user_id !== user.id) {
    return { success: false, error: "Comment not found." };
  }

  const { error } = await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId);

  if (error) return { success: false, error: "Could not delete comment." };

  revalidatePath("/community");
  return { success: true };
}
