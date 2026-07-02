import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  censorCommunityText,
  normalizeCommunityText,
  validateCommunityText,
} from "@/lib/community-text-filter";
import type { Database } from "@/lib/supabase/types";

type Supabase = SupabaseClient<Database>;

export type CommunityAction =
  | "post"
  | "comment"
  | "chat"
  | "alert"
  | "upload";

const RATE_LIMITS: Record<
  CommunityAction,
  { windowMinutes: number; maxCount: number }
> = {
  post: { windowMinutes: 60, maxCount: 5 },
  comment: { windowMinutes: 60, maxCount: 20 },
  chat: { windowMinutes: 1, maxCount: 10 },
  alert: { windowMinutes: 24 * 60, maxCount: 3 },
  upload: { windowMinutes: 60, maxCount: 10 },
};

const CHAT_MIN_ACCOUNT_HOURS = 24;

export { censorCommunityText, normalizeCommunityText, validateCommunityText };

export async function getBlockedUserIds(
  supabase: Supabase,
  userId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);

  return new Set((data ?? []).map((row) => row.blocked_id));
}

export async function assertRateLimit(
  supabase: Supabase,
  userId: string,
  action: CommunityAction,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const limit = RATE_LIMITS[action];
  const since = new Date(
    Date.now() - limit.windowMinutes * 60 * 1000,
  ).toISOString();

  const { count } = await supabase
    .from("rate_limit_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", since);

  if ((count ?? 0) >= limit.maxCount) {
    const unit =
      limit.windowMinutes >= 60
        ? `${Math.round(limit.windowMinutes / 60)} hour(s)`
        : `${limit.windowMinutes} minute(s)`;
    return {
      ok: false,
      error: `Slow down — try again in ${unit}.`,
    };
  }

  await supabase.from("rate_limit_events").insert({
    user_id: userId,
    action,
  });

  return { ok: true };
}

export async function assertCommunityWriteAccess(
  supabase: Supabase,
  userId: string,
  options: {
    requireChat?: boolean;
    requireGuidelines?: boolean;
  } = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "accepted_terms_at, community_guidelines_at, community_banned_until, created_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.accepted_terms_at) {
    return { ok: false, error: "Accept the Terms of Service to use Community." };
  }

  if (
    profile.community_banned_until &&
    new Date(profile.community_banned_until) > new Date()
  ) {
    return {
      ok: false,
      error: "Your community access is temporarily suspended.",
    };
  }

  if (options.requireGuidelines && !profile.community_guidelines_at) {
    return {
      ok: false,
      error: "Please read and accept the Community Guidelines first.",
    };
  }

  if (options.requireChat) {
    const accountAgeHours =
      (Date.now() - new Date(profile.created_at).getTime()) / 3_600_000;

    const { count: captureCount } = await supabase
      .from("captures")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (
      accountAgeHours < CHAT_MIN_ACCOUNT_HOURS &&
      (captureCount ?? 0) < 1
    ) {
      return {
        ok: false,
        error:
          "Chat unlocks after your first catch or 24 hours on CatDex.",
      };
    }
  }

  return { ok: true };
}

export async function assertUrgentAlertAllowed(
  supabase: Supabase,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();

  const accountAgeDays = profile
    ? (Date.now() - new Date(profile.created_at).getTime()) / 86_400_000
    : 0;

  const [{ count: captures }, { count: priorAlerts }] = await Promise.all([
    supabase
      .from("captures")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("rescue_alerts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const trusted =
    accountAgeDays >= 7 ||
    (captures ?? 0) >= 3 ||
    (priorAlerts ?? 0) >= 1;

  if (!trusted) {
    return {
      ok: false,
      error:
        "Urgent alerts unlock after 7 days, 3 catches, or a prior alert.",
    };
  }

  return { ok: true };
}

export function isAllowedPostImageUrl(
  url: string,
  userId: string,
  supabaseProjectUrl: string,
): boolean {
  if (!url.startsWith("http")) return false;

  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "res.cloudinary.com" &&
      url.includes(`/catdex/${userId}/`)
    ) {
      return true;
    }

    const projectHost = new URL(supabaseProjectUrl).hostname;
    if (
      parsed.hostname === projectHost &&
      url.includes("/storage/v1/object/public/post-images/") &&
      url.includes(`/${userId}/`)
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function isWebImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }
  // WebP: RIFF....WEBP
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true;
  }

  return false;
}
