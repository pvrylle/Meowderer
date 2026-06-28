"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { syncMissionProgress } from "@/lib/missions";
import { createClient } from "@/lib/supabase/server";

const createPollSchema = z.object({
  captureId: z.string().uuid(),
  optionA: z.string().trim().min(1).max(40),
  optionB: z.string().trim().min(1).max(40),
});

const voteSchema = z.object({
  pollId: z.string().uuid(),
  choice: z.enum(["a", "b"]),
});

export type NamePollWithCounts = {
  id: string;
  capture_id: string;
  user_id: string;
  option_a: string;
  option_b: string;
  votes_a: number;
  votes_b: number;
  my_choice: "a" | "b" | null;
};

export async function getNamePollForCapture(
  captureId: string,
): Promise<NamePollWithCounts | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: poll } = await supabase
    .from("name_polls")
    .select("*")
    .eq("capture_id", captureId)
    .maybeSingle();

  if (!poll) return null;

  const { data: votes } = await supabase
    .from("name_poll_votes")
    .select("user_id, choice")
    .eq("poll_id", poll.id);

  const votes_a = votes?.filter((v) => v.choice === "a").length ?? 0;
  const votes_b = votes?.filter((v) => v.choice === "b").length ?? 0;
  const myVote = user
    ? votes?.find((v) => v.user_id === user.id)?.choice ?? null
    : null;

  return {
    ...poll,
    votes_a,
    votes_b,
    my_choice: myVote as "a" | "b" | null,
  };
}

export async function createNamePollAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const parsed = createPollSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid poll." };

  const { data: capture } = await supabase
    .from("captures")
    .select("user_id")
    .eq("id", parsed.data.captureId)
    .maybeSingle();

  if (!capture || capture.user_id !== user.id) {
    return { success: false as const, error: "You can only poll on your own cats." };
  }

  const { error } = await supabase.from("name_polls").insert({
    capture_id: parsed.data.captureId,
    user_id: user.id,
    option_a: parsed.data.optionA,
    option_b: parsed.data.optionB,
  });

  if (error) {
    return {
      success: false as const,
      error: error.code === "23505" ? "Poll already exists for this cat." : "Could not create poll.",
    };
  }

  revalidatePath(`/cat/${parsed.data.captureId}`);
  return { success: true as const };
}

export async function voteNamePollAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not signed in." };

  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid vote." };

  const { data: poll } = await supabase
    .from("name_polls")
    .select("capture_id, user_id")
    .eq("id", parsed.data.pollId)
    .maybeSingle();

  if (!poll) return { success: false as const, error: "Poll not found." };
  if (poll.user_id === user.id) {
    return { success: false as const, error: "You cannot vote on your own poll." };
  }

  const { error } = await supabase.from("name_poll_votes").insert({
    poll_id: parsed.data.pollId,
    user_id: user.id,
    choice: parsed.data.choice,
  });

  if (error) {
    return {
      success: false as const,
      error: error.code === "23505" ? "You already voted." : "Could not vote.",
    };
  }

  await syncMissionProgress(supabase, user.id);

  revalidatePath(`/cat/${poll.capture_id}`);
  revalidatePath("/missions");
  return { success: true as const };
}
