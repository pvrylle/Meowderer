import { redirect } from "next/navigation";

import { AchievementSessionToasts } from "@/components/achievement-session-toasts";
import { BottomNav } from "@/components/bottom-nav";
import { OfflineSyncProvider } from "@/components/offline-sync-provider";
import { TermsConsentModal } from "@/components/terms-consent-modal";
import { getCurrentUser, isDemoSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  let needsTermsConsent = false;
  if (!(await isDemoSession())) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("accepted_terms_at")
      .eq("id", user.id)
      .maybeSingle();
    needsTermsConsent = !profile?.accepted_terms_at;
  }

  return (
    <OfflineSyncProvider>
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <TermsConsentModal show={needsTermsConsent} />
        <AchievementSessionToasts />
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto scroll-pb-nav scrollbar-none">
          {children}
        </main>
        <BottomNav />
      </div>
    </OfflineSyncProvider>
  );
}
