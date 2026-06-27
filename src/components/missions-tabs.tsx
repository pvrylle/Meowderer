"use client";

import { useState } from "react";

import { BadgesGrid } from "@/components/badges-grid";
import { MissionsList } from "@/components/missions-list";
import type { UserBadge, UserMission } from "@/lib/mission-types";
import { cn } from "@/lib/utils";

type MissionsTabsProps = {
  missions: UserMission[];
  badges: UserBadge[];
  totalXp: number;
  level: number;
};

export function MissionsTabs({
  missions,
  badges,
  totalXp,
  level,
}: MissionsTabsProps) {
  const [tab, setTab] = useState<"missions" | "badges">("missions");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Missions & Badges
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete quests, earn XP, unlock badges
          </p>
        </div>
        <div className="rounded-2xl bg-primary/10 px-3 py-2 text-center">
          <p className="text-xs font-semibold text-muted-foreground">Level</p>
          <p className="text-lg font-extrabold text-primary">{level}</p>
          <p className="text-[10px] text-muted-foreground">{totalXp} XP</p>
        </div>
      </div>

      <div className="flex rounded-2xl border border-border bg-card p-1">
        {(["missions", "badges"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-bold capitalize transition-colors",
              tab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === "missions" ? (
        <MissionsList missions={missions} />
      ) : (
        <BadgesGrid badges={badges} />
      )}
    </div>
  );
}
