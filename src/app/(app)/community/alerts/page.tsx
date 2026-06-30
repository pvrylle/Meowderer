import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { AlertList } from "@/components/alert-list";
import { ReportAlertForm } from "@/components/report-alert-form";
import { getCurrentUser, isDemoSession } from "@/lib/auth";
import { getRescueAlerts } from "@/lib/community";
import { createClient } from "@/lib/supabase/server";

export default async function CommunityAlertsPage() {
  const [user, demo] = await Promise.all([getCurrentUser(), isDemoSession()]);

  let alerts: Awaited<ReturnType<typeof getRescueAlerts>> = [];

  if (!demo && user) {
    const supabase = await createClient();
    alerts = await getRescueAlerts(supabase, user.id);
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-nav">
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
        {user ? (
          <AlertList alerts={alerts} currentUserId={user.id} />
        ) : (
          <AlertList alerts={[]} currentUserId="" />
        )}
      </section>
    </div>
  );
}
