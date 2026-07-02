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
      <section className="mx-4 mb-4 rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Vote className="size-4 text-primary" />
          <h2 className="font-bold text-foreground">Name this cat</h2>
        </div>
        <form onSubmit={handleCreate} className="space-y-2">
          <input
            value={optionA}
            onChange={(e) => setOptionA(e.target.value)}
            placeholder="Name option A"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
            placeholder="Name option B"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
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
    <section className="mx-4 mb-4 rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Vote className="size-4 text-primary" />
        <h2 className="font-bold text-foreground">Pick a name</h2>
      </div>
      <div className="space-y-2">
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
                "relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background active:bg-muted/50",
                (isOwner || poll.my_choice != null) && "cursor-default",
              )}
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary/10"
                style={{ width: `${pct}%` }}
              />
              <span className="relative flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {count} · {pct}%
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {poll.my_choice && (
        <p className="mt-2 text-center text-xs font-semibold text-primary">
          Thanks for voting!
        </p>
      )}
      {isOwner && (
        <div className="mt-3 space-y-2">
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
