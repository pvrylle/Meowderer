"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ChevronLeft, ChevronRight, Siren } from "lucide-react";

import { CommunityChat } from "@/components/community-chat";
import { CommunityFeed } from "@/components/community-feed";
import { useNearbyShelterCount } from "@/hooks/use-nearby-shelter-count";
import type { PostWithAuthor, ChatMessageWithAuthor } from "@/lib/community";
import type { RescueAlert } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type CommunityTabsProps = {
  posts: PostWithAuthor[];
  messages: ChatMessageWithAuthor[];
  alerts: RescueAlert[];
  urgentCount: number;
  currentUserId: string;
};

export function CommunityTabs({
  posts,
  messages,
  alerts,
  urgentCount,
  currentUserId,
}: CommunityTabsProps) {
  const [tab, setTab] = useState<"feed" | "chat">("feed");
  const shelterCount = useNearbyShelterCount();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold text-foreground">Community</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/community/alerts"
          className="flex items-center justify-between rounded-2xl border border-border bg-destructive/10 p-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <Siren className="size-5 text-destructive" />
              <span className="font-bold text-foreground">Rescue Alerts</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-destructive">
              {urgentCount} urgent
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
        <Link
          href="/map"
          className="flex items-center justify-between rounded-2xl border border-border bg-green/15 p-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-green" />
              <span className="font-bold text-foreground">Shelters</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-green">
              {shelterCount != null
                ? `${shelterCount} nearby`
                : "On map"}
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 2).map((alert) => (
            <Link
              key={alert.id}
              href="/community/alerts"
              className={cn(
                "block rounded-xl border px-3 py-2 text-sm",
                alert.urgent
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border bg-muted/30",
              )}
            >
              <p className="font-bold text-foreground">{alert.title}</p>
              {alert.body && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {alert.body}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="flex rounded-2xl border border-border bg-card p-1">
        {(["feed", "chat"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-bold capitalize transition-colors",
              tab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === "feed" ? (
        <CommunityFeed posts={posts} />
      ) : (
        <CommunityChat
          initialMessages={messages}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
