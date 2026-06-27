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
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-orange/15">
          <Flame className="size-5 text-orange" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Streak
          </p>
          <p className="text-lg font-extrabold text-foreground">
            {streakCount > 0 ? `${streakCount}-day` : "Start today"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Daily goal
            </p>
          </div>
          <span className="text-sm font-bold text-primary">
            {todayCount}/{dailyGoal}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
