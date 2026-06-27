"use client";

import type { UnlockedAchievement } from "@/lib/achievements";
import { cn } from "@/lib/utils";

type AchievementsGridProps = {
  catalog: { id: string; title: string; description: string | null; icon: string | null }[];
  unlocked: UnlockedAchievement[];
};

export function AchievementsGrid({ catalog, unlocked }: AchievementsGridProps) {
  const unlockedIds = new Set(unlocked.map((a) => a.id));

  if (catalog.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Achievements will appear after you run the latest database migration.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {catalog.map((ach) => {
        const isUnlocked = unlockedIds.has(ach.id);
        const unlockedAt = unlocked.find((u) => u.id === ach.id)?.unlocked_at;

        return (
          <div
            key={ach.id}
            className={cn(
              "flex flex-col gap-1 rounded-2xl border p-3",
              isUnlocked
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-muted/30 opacity-60",
            )}
          >
            <span className="text-2xl" aria-hidden>
              {isUnlocked ? (ach.icon ?? "🏆") : "🔒"}
            </span>
            <p className="text-sm font-bold text-foreground">{ach.title}</p>
            {ach.description && (
              <p className="text-xs text-muted-foreground">{ach.description}</p>
            )}
            {unlockedAt && (
              <p className="mt-auto text-[10px] text-muted-foreground">
                {new Date(unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
