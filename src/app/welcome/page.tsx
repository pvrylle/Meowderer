import { redirect } from "next/navigation";

import { WelcomeForm } from "@/components/welcome-form";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_complete) redirect("/home");

  const suggested =
    profile?.username ?? user.email?.split("@")[0] ?? "cat_lover";

  return <WelcomeForm suggestedUsername={suggested} />;
}
