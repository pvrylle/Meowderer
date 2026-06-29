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
}: MissionsTabsProps) {
  const [tab, setTab] = useState<"missions" | "badges">("missions");

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {(["missions", "badges"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-medium capitalize transition-colors",
              tab === key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
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
