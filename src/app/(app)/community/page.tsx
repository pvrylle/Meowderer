import { CommunityTabs } from "@/components/community-tabs";
import { getCurrentUser, isDemoSession } from "@/lib/auth";
import {
  countUrgentAlerts,
  getChatMessages,
  getPosts,
  getRescueAlerts,
} from "@/lib/community";
import { createClient } from "@/lib/supabase/server";

export default async function CommunityPage() {
  const [user, demo] = await Promise.all([getCurrentUser(), isDemoSession()]);

  let posts: Awaited<ReturnType<typeof getPosts>> = [];
  let messages: Awaited<ReturnType<typeof getChatMessages>> = [];
  let alerts: Awaited<ReturnType<typeof getRescueAlerts>> = [];
  let urgentCount = 0;

  if (!demo && user) {
    const supabase = await createClient();
    [posts, messages, alerts, urgentCount] = await Promise.all([
      getPosts(supabase, user.id),
      getChatMessages(supabase, "general").then(async (general) => {
        const others = await Promise.all(
          ["cat_care", "rescue", "shelters"].map((ch) =>
            getChatMessages(supabase, ch),
          ),
        );
        return [...general, ...others.flat()];
      }),
      getRescueAlerts(supabase),
      countUrgentAlerts(supabase),
    ]);
  }

  return (
    <div className="flex flex-col pb-nav">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-green/15 to-background px-5 pb-4 pt-4">
        <div className="absolute -right-10 -top-10 size-32 rounded-full bg-green/10 blur-3xl" />
        <h1 className="relative text-2xl font-bold text-foreground">Community</h1>
        <p className="relative mt-0.5 text-sm text-muted-foreground">
          Connect with other cat lovers
        </p>
      </div>

      <div className="px-5 pt-2">
        <CommunityTabs
          posts={posts}
          messages={messages}
          alerts={alerts}
          urgentCount={urgentCount}
          currentUserId={user?.id ?? ""}
        />
      </div>
    </div>
  );
}
