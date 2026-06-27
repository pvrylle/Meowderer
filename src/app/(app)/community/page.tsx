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
    <div className="p-6 pb-28">
      <CommunityTabs
        posts={posts}
        messages={messages}
        alerts={alerts}
        urgentCount={urgentCount}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
