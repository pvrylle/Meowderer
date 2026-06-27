import { redirect } from "next/navigation";

import { AchievementSessionToasts } from "@/components/achievement-session-toasts";
import { BottomNav } from "@/components/bottom-nav";
import { OfflineSyncProvider } from "@/components/offline-sync-provider";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <OfflineSyncProvider>
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <AchievementSessionToasts />
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto scroll-pb-nav scrollbar-none">
          {children}
        </main>
        <BottomNav />
      </div>
    </OfflineSyncProvider>
  );
}
