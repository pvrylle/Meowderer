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
      <p className="text-sm text-muted-foreground">
        Badges will appear after you run the latest database migration.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {badges.map((badge) => {
        const unlocked = badge.level > 0;
        const nextThreshold = xpForBadgeLevel(badge.level + 1);
        const progressPct =
          badge.level >= badge.max_level
            ? 100
            : Math.min(100, Math.round((badge.xp / nextThreshold) * 100));

        return (
          <div
            key={badge.id}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center",
              unlocked ? "border-border bg-card" : "border-border/60 bg-muted/30",
            )}
          >
            <div
              className="relative flex size-14 items-center justify-center rounded-2xl text-primary"
              style={{ backgroundColor: badge.color ?? "#d9ccf6" }}
            >
              <BadgeIcon badgeId={badge.id} className="size-6" />
              {unlocked && (
                <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                  Lv.{badge.level}
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-foreground">{badge.title}</p>
            {!unlocked || badge.level < badge.max_level ? (
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            ) : (
              <p className="text-[10px] font-semibold text-primary">Max level</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
