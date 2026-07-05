import { Check, Flame } from "lucide-react";

import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type WeekDay = {
  iso: string;
  label: string;
  dayNum: number;
  hasCatch: boolean;
  isToday: boolean;
  isFuture: boolean;
};

/**
 * Build the current Mon-Sun week using UTC dates so it lines up with the
 * streak logic in retention.ts (which buckets captures by UTC day).
 */
function buildWeek(caughtAt: string[]): WeekDay[] {
  const caughtDays = new Set(caughtAt.map((c) => c.slice(0, 10)));

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const todayIso = today.toISOString().slice(0, 10);

  // Days since Monday (getUTCDay: 0 = Sun … 6 = Sat).
  const sinceMonday = (today.getUTCDay() + 6) % 7;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - sinceMonday);

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      iso,
      label: WEEKDAY_LABELS[i],
      dayNum: d.getUTCDate(),
      hasCatch: caughtDays.has(iso),
      isToday: iso === todayIso,
      isFuture: d.getTime() > today.getTime(),
    });
  }
  return days;
}

export function StreakWeekCalendar({
  caughtAt,
  streakCount,
}: {
  caughtAt: string[];
  streakCount: number;
}) {
  const days = buildWeek(caughtAt);
  const activeDays = days.filter((d) => d.hasCatch).length;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
      <div className="mb-3.5 flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-orange/15">
          <Flame className="size-4 text-orange" fill="currentColor" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {streakCount > 0
              ? `${streakCount}-day streak`
              : "Start your streak"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {activeDays > 0
              ? `${activeDays} active ${activeDays === 1 ? "day" : "days"} this week`
              : "Catch a cat to light it up"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {days.map((day, i) => (
          <div
            key={day.iso}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase",
                day.isToday ? "text-orange" : "text-muted-foreground",
              )}
            >
              {day.label}
              {/* Distinguish the two S / two T columns for screen readers */}
              <span className="sr-only">{` day ${i + 1}`}</span>
            </span>
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                day.hasCatch
                  ? "bg-orange text-white shadow-sm"
                  : day.isFuture
                    ? "bg-muted/40 text-muted-foreground/40"
                    : "bg-muted text-muted-foreground/70",
                day.isToday && !day.hasCatch && "ring-2 ring-orange/50",
              )}
              aria-label={
                day.hasCatch
                  ? `${day.iso}: caught a cat`
                  : `${day.iso}: no catch`
              }
            >
              {day.hasCatch ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                day.dayNum
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
