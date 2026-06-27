import { SettingsForm } from "@/components/settings-form";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let displayName = "You";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, username")
      .eq("id", user.id)
      .maybeSingle();
    avatarUrl = profile?.avatar_url ?? null;
    displayName = profile?.username ?? user.email?.split("@")[0] ?? "You";
  }

  return (
    <SettingsForm initialAvatar={avatarUrl} displayName={displayName} />
  );
}
