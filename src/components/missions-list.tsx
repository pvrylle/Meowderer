"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { toast } from "sonner";

import { claimMissionAction } from "@/app/(app)/missions/actions";
import { CatButton } from "@/components/ui/cat-button";
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
      <p className="text-sm text-muted-foreground">
        Missions will appear after you run the latest database migration.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {missions.map((mission) => {
        const complete = mission.progress >= mission.target_count;
        const claimed = Boolean(mission.claimed_at);
        const pct = Math.min(
          100,
          Math.round((mission.progress / mission.target_count) * 100),
        );

        return (
          <div
            key={mission.id}
            className={cn(
              "rounded-2xl border bg-card p-4",
              complete && !claimed ? "border-green/50" : "border-border",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl">
                {mission.icon ?? "🎯"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-foreground">{mission.title}</p>
                  <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    <Zap className="size-3" />
                    {mission.xp_reward}XP
                  </span>
                </div>
                {mission.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {mission.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        complete ? "bg-green" : "bg-primary",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">
                    {Math.min(mission.progress, mission.target_count)}/
                    {mission.target_count}
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
                {claiming === mission.id ? "Claiming…" : "Claim Reward"}
              </CatButton>
            )}
            {claimed && (
              <p className="mt-2 text-center text-xs font-semibold text-green">
                Reward claimed
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
