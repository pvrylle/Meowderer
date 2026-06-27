import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ReportAlertForm } from "@/components/report-alert-form";
import { getCurrentUser, isDemoSession } from "@/lib/auth";
import { getRescueAlerts } from "@/lib/community";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function CommunityAlertsPage() {
  const [user, demo] = await Promise.all([getCurrentUser(), isDemoSession()]);

  let alerts: Awaited<ReturnType<typeof getRescueAlerts>> = [];

  if (!demo && user) {
    const supabase = await createClient();
    alerts = await getRescueAlerts(supabase);
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-28">
      <header className="flex items-center gap-3">
        <Link
          href="/community"
          className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-extrabold text-foreground">Rescue Alerts</h1>
      </header>

      <ReportAlertForm />

      <section className="space-y-3">
        <h2 className="font-bold text-foreground">Active alerts</h2>
        {alerts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
            No active alerts. Stay safe out there!
          </p>
        ) : (
          alerts.map((alert) => (
            <div
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
            </div>
          ))
        )}
      </section>
    </div>
  );
}
