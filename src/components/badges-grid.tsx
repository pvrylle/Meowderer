import { xpForBadgeLevel } from "@/lib/xp";
import { BadgeIcon } from "@/lib/mission-icons";
import type { UserBadge } from "@/lib/mission-types";
import { cn } from "@/lib/utils";

type BadgesGridProps = {
  badges: UserBadge[];
};

export function BadgesGrid({ badges }: BadgesGridProps) {
  if (badges.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        No badges yet
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {badges.map((badge) => {
        const unlocked = badge.level > 0;
        const maxed = badge.level >= badge.max_level;
        const nextThreshold = xpForBadgeLevel(badge.level + 1);
        const progressPct = maxed
          ? 100
          : Math.min(100, Math.round((badge.xp / nextThreshold) * 100));

        return (
          <div
            key={badge.id}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl p-3 text-center ring-1",
              unlocked ? "bg-card ring-border/50" : "bg-muted/30 ring-border/40 opacity-60",
            )}
          >
            <div
              className="relative flex size-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: badge.color ?? "#e8e1f5" }}
            >
              <BadgeIcon badgeId={badge.id} className="size-5 text-primary" />
              {unlocked && (
                <span className="absolute -bottom-0.5 -right-0.5 rounded bg-primary px-1 text-[8px] font-bold text-white">
                  {badge.level}
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-foreground">{badge.title}</p>
            {!maxed && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
            {maxed && (
              <p className="text-[9px] font-medium text-primary">Max</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
