"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Vote } from "lucide-react";
import { toast } from "sonner";

import {
  applyPollWinnerAction,
  createNamePollAction,
  voteNamePollAction,
  type NamePollWithCounts,
} from "@/app/(app)/cat/[id]/poll-actions";
import { CatButton } from "@/components/ui/cat-button";
import type { Capture } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type NamePollCardProps = {
  capture: Capture;
  poll: NamePollWithCounts | null;
  isOwner: boolean;
};

export function NamePollCard({ capture, poll, isOwner }: NamePollCardProps) {
  const router = useRouter();
  const [optionA, setOptionA] = useState(capture.nickname?.trim() || "Option A");
  const [optionB, setOptionB] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!optionA.trim() || !optionB.trim()) return;
    setLoading(true);
    const result = await createNamePollAction({
      captureId: capture.id,
      optionA: optionA.trim(),
      optionB: optionB.trim(),
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not create poll.");
      return;
    }
    toast.success("Name poll created!");
    router.refresh();
  }

  async function handleVote(choice: "a" | "b") {
    if (!poll) return;
    setLoading(true);
    const result = await voteNamePollAction({ pollId: poll.id, choice });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not vote.");
      return;
    }
    toast.success("Vote counted!");
    router.refresh();
  }

  if (isOwner && !poll) {
    return (
      <section className="relative z-10 mx-3 mb-4 rounded-[1.75rem] border border-border/60 bg-card/88 p-4 shadow-[0_18px_40px_rgba(58,53,80,0.08)] backdrop-blur-xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Vote className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-foreground">Name this cat</h2>
            <p className="text-sm text-muted-foreground">
              Start a two-option poll and let the community choose.
            </p>
          </div>
        </div>
        <form onSubmit={handleCreate} className="space-y-2.5">
          <input
            value={optionA}
            onChange={(e) => setOptionA(e.target.value)}
            placeholder="Name option A"
            className="w-full rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/70 focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(136,105,209,0.12)]"
          />
          <input
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
            placeholder="Name option B"
            className="w-full rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/70 focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(136,105,209,0.12)]"
          />
          <CatButton type="submit" size="sm" block loading={loading}>
            Start name poll
          </CatButton>
        </form>
      </section>
    );
  }

  if (!poll) return null;

  const total = poll.votes_a + poll.votes_b;

  return (
    <section className="relative z-10 mx-3 mb-4 rounded-[1.75rem] border border-border/60 bg-card/88 p-4 shadow-[0_18px_40px_rgba(58,53,80,0.08)] backdrop-blur-xl">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Vote className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-foreground">Pick a name</h2>
          <p className="text-sm text-muted-foreground">
            Tap the option you like best. Each vote updates the leaderboard.
          </p>
        </div>
      </div>
      <div className="space-y-2.5">
        {(["a", "b"] as const).map((choice) => {
          const label = choice === "a" ? poll.option_a : poll.option_b;
          const count = choice === "a" ? poll.votes_a : poll.votes_b;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const selected = poll.my_choice === choice;

          return (
            <button
              key={choice}
              type="button"
              disabled={loading || isOwner || poll.my_choice != null}
              onClick={() => handleVote(choice)}
              className={cn(
                "relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left text-sm transition-all",
                selected
                  ? "border-primary/40 bg-primary/10 shadow-[0_0_0_1px_rgba(136,105,209,0.1)]"
                  : "border-border/60 bg-background/80 hover:bg-muted/50 active:bg-muted/60",
                (isOwner || poll.my_choice != null) && "cursor-default",
              )}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-r-2xl bg-primary/10 transition-[width]"
                style={{ width: `${pct}%` }}
              />
              <span className="relative flex items-center justify-between gap-3">
                <span className="font-semibold text-foreground">{label}</span>
                <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
                  {count} · {pct}%
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {poll.my_choice && (
        <p className="mt-3 text-center text-xs font-semibold text-primary">
          Thanks for voting!
        </p>
      )}
      {isOwner && (
        <div className="mt-4 space-y-2.5 border-t border-border/60 pt-4">
          <p className="text-center text-xs text-muted-foreground">
            {total} vote{total === 1 ? "" : "s"} so far
          </p>
          <CatButton
            type="button"
            size="sm"
            variant="outline"
            block
            loading={loading}
            onClick={async () => {
              setLoading(true);
              const result = await applyPollWinnerAction(poll.id);
              setLoading(false);
              if (!result.success) toast.error(result.error ?? "Could not apply.");
              else {
                toast.success("Winning name applied!");
                router.refresh();
              }
            }}
          >
            Apply winning name
          </CatButton>
        </div>
      )}
    </section>
  );
}
