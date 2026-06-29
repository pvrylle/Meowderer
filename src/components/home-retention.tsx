import { Flame, Target } from "lucide-react";

type HomeRetentionProps = {
  streakCount: number;
  dailyGoal: number;
  todayCount: number;
};

export function HomeRetention({
  streakCount,
  dailyGoal,
  todayCount,
}: HomeRetentionProps) {
  const progress = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-orange/15">
          <Flame className="size-5 text-orange" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Streak
          </p>
          <p className="text-base font-bold text-foreground">
            {streakCount > 0 ? `${streakCount}-day` : "Start"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="size-3.5 text-primary" />
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Daily
            </p>
          </div>
          <span className="text-xs font-semibold text-primary">
            {todayCount}/{dailyGoal}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
