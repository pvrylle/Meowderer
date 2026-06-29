"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";

import { claimMissionAction } from "@/app/(app)/missions/actions";
import { CatButton } from "@/components/ui/cat-button";
import { MissionIcon } from "@/lib/mission-icons";
import type { UserMission } from "@/lib/mission-types";
import { cn } from "@/lib/utils";

type MissionsListProps = {
  missions: UserMission[];
};

export function MissionsList({ missions }: MissionsListProps) {
  const router = useRouter();
  const [claiming, setClaiming] = useState<string | null>(null);

  async function handleClaim(missionId: string) {
    setClaiming(missionId);
    const result = await claimMissionAction(missionId);
    setClaiming(null);
    if (!result.success) {
      toast.error(result.error ?? "Could not claim reward.");
      return;
    }
    toast.success(`+${result.xp} XP claimed!`);
    router.refresh();
  }

  if (missions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        No missions available
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {missions.map((mission) => {
        const complete = mission.progress >= mission.target_count;
        const claimed = Boolean(mission.claimed_at);
        const pct = Math.min(100, Math.round((mission.progress / mission.target_count) * 100));

        return (
          <div
            key={mission.id}
            className={cn(
              "rounded-xl bg-card p-3.5 shadow-sm ring-1",
              complete && !claimed ? "ring-green/50" : "ring-border/50",
            )}
          >
            <div className="flex gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  complete && !claimed
                    ? "bg-green/15 text-green"
                    : claimed
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary",
                )}
              >
                {complete && !claimed ? (
                  <Check className="size-5" strokeWidth={2.5} />
                ) : (
                  <MissionIcon missionId={mission.id} className="size-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn(
                    "text-sm font-medium",
                    claimed ? "text-muted-foreground" : "text-foreground",
                  )}>
                    {mission.title}
                  </p>
                  <span className={cn(
                    "flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                    claimed ? "bg-muted text-muted-foreground" : "bg-legendary/15 text-legendary",
                  )}>
                    <Zap className="size-3" />
                    {mission.xp_reward}
                  </span>
                </div>

                {mission.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {mission.description}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        complete ? "bg-green" : "bg-primary",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {Math.min(mission.progress, mission.target_count)}/{mission.target_count}
                  </span>
                </div>
              </div>
            </div>

            {complete && !claimed && (
              <CatButton
                size="sm"
                block
                className="mt-3 bg-green hover:bg-green/90"
                disabled={claiming === mission.id}
                onClick={() => handleClaim(mission.id)}
              >
                {claiming === mission.id ? "Claiming..." : "Claim"}
              </CatButton>
            )}

            {claimed && (
              <p className="mt-2 text-center text-[10px] font-medium text-green">
                Claimed
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
