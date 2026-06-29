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
      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        No achievements yet
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {catalog.slice(0, 4).map((ach) => {
        const isUnlocked = unlockedIds.has(ach.id);
        const unlockedAt = unlocked.find((u) => u.id === ach.id)?.unlocked_at;

        return (
          <div
            key={ach.id}
            className={cn(
              "rounded-xl p-3 ring-1",
              isUnlocked
                ? "bg-primary/5 ring-primary/20"
                : "bg-muted/30 ring-border/50 opacity-60",
            )}
          >
            <span className="text-xl">{isUnlocked ? (ach.icon ?? "🏆") : "🔒"}</span>
            <p className="mt-1 text-xs font-medium text-foreground">{ach.title}</p>
            {ach.description && (
              <p className="text-[10px] text-muted-foreground line-clamp-1">{ach.description}</p>
            )}
            {unlockedAt && (
              <p className="mt-1 text-[9px] text-muted-foreground">
                {new Date(unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
