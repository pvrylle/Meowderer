"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { resolveAlertAction } from "@/app/(app)/community/actions";
import { ReportContentButton } from "@/components/report-content-button";
import { CatButton } from "@/components/ui/cat-button";
import type { RescueAlert } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type AlertListProps = {
  alerts: RescueAlert[];
  currentUserId: string;
};

export function AlertList({ alerts, currentUserId }: AlertListProps) {
  const router = useRouter();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function handleResolve(alertId: string) {
    setResolvingId(alertId);
    const result = await resolveAlertAction(alertId);
    setResolvingId(null);

    if (!result.success) {
      toast.error(result.error ?? "Could not resolve alert.");
      return;
    }

    toast.success("Alert marked resolved — thanks for verifying!");
    router.refresh();
  }

  if (alerts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
        No active alerts. Stay safe out there!
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {alerts.map((alert) => {
        const isAuthor = alert.user_id === currentUserId;
        const canVerify = !isAuthor && !alert.resolved;

        return (
          <li
            key={alert.id}
            className={cn(
              "rounded-2xl border p-4",
              alert.urgent
                ? "border-destructive/40 bg-destructive/5"
                : "border-border bg-card",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-extrabold text-foreground">{alert.title}</p>
              {alert.urgent && (
                <span className="shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
                  Urgent
                </span>
              )}
            </div>
            {alert.body && (
              <p className="mt-1 text-sm text-muted-foreground">{alert.body}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(alert.created_at).toLocaleString()}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {canVerify && (
                <CatButton
                  variant="outline"
                  size="sm"
                  loading={resolvingId === alert.id}
                  onClick={() => handleResolve(alert.id)}
                >
                  <CheckCircle2 className="size-4" />
                  Mark resolved
                </CatButton>
              )}
              {alert.user_id !== currentUserId && (
                <ReportContentButton
                  target={{
                    contentType: "rescue_alert",
                    contentId: alert.id,
                    reportedUserId: alert.user_id,
                    label: alert.title,
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:text-destructive"
                />
              )}
            </div>
            {isAuthor && (
              <p className="mt-3 text-xs text-muted-foreground">
                Waiting for a community member to verify this alert.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
