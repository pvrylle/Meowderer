"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isDemoSession } from "@/lib/auth";
import { deleteCaptureAssetsByUrls } from "@/lib/cloudinary";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function changePasswordAction(formData: FormData): Promise<{
  error?: string;
  success?: boolean;
}> {
  if (await isDemoSession()) {
    return { error: "Not available in demo mode." };
  }

  const password = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "Password must include at least one letter.")
    .regex(/[0-9]/, "Password must include at least one number.")
    .safeParse(formData.get("password"));

  if (!password.success) {
    return { error: password.error.issues[0]?.message ?? "Invalid password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function signOutEverywhereAction(): Promise<void> {
  if (await isDemoSession()) {
    redirect("/auth");
  }

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/auth");
}

export async function deleteAccountAction(): Promise<{ error?: string }> {
  if (await isDemoSession()) {
    return { error: "Not available in demo mode." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: captures } = await supabase
    .from("captures")
    .select("photo_url, sticker_url, stray_cat_id")
    .eq("user_id", user.id);

  if (captures) {
    await Promise.all(
      captures.map((c) =>
        deleteCaptureAssetsByUrls(user.id, c.photo_url, c.sticker_url),
      ),
    );

    // Collect stray_cat ids linked to this user's captures, then remove any
    // that will have zero remaining captures after account deletion.
    const strayCatIds = [
      ...new Set(
        captures.map((c) => c.stray_cat_id).filter((id): id is string => Boolean(id)),
      ),
    ];

    if (strayCatIds.length > 0) {
      // Only count captures from OTHER users — this user's rows are about to go.
      const { data: remaining } = await supabase
        .from("captures")
        .select("stray_cat_id")
        .in("stray_cat_id", strayCatIds)
        .neq("user_id", user.id);

      const stillLinked = new Set((remaining ?? []).map((r) => r.stray_cat_id));
      const orphanIds = strayCatIds.filter((id) => !stillLinked.has(id));

      if (orphanIds.length > 0) {
        await supabase.from("stray_cats").delete().in("id", orphanIds);
      }
    }
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        "Account deletion is not configured on this server. Contact support@meowderer.app.",
    };
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect("/auth");
}
