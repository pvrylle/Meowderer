"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Siren } from "lucide-react";

import { CommunityChat } from "@/components/community-chat";
import { CommunityFeed } from "@/components/community-feed";
import type { PostWithAuthor } from "@/lib/community";
import type { RescueAlert } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type CommunityTabsProps = {
  posts: PostWithAuthor[];
  messages: Array<{
    id: string;
    user_id: string;
    body: string;
    created_at: string;
    author_name: string;
    channel: string;
  }>;
  alerts: RescueAlert[];
  urgentCount: number;
  currentUserId: string;
  shelterCount?: number;
};

export function CommunityTabs({
  posts,
  messages,
  alerts,
  urgentCount,
  currentUserId,
  shelterCount = 0,
}: CommunityTabsProps) {
  const [tab, setTab] = useState<"feed" | "chat">("feed");

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold text-foreground">Community</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/map?layer=shelters"
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
          href="/map?layer=shelters"
          className="flex items-center justify-between rounded-2xl border border-border bg-green/15 p-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-green" />
              <span className="font-bold text-foreground">Shelters</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-green">
              {shelterCount > 0 ? `${shelterCount} nearby` : "On map"}
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 2).map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm",
                alert.urgent
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border bg-muted/30",
              )}
            >
              <p className="font-bold text-foreground">{alert.title}</p>
              {alert.body && (
                <p className="text-xs text-muted-foreground">{alert.body}</p>
              )}
            </div>
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
        <CommunityChat messages={messages} currentUserId={currentUserId} />
      )}
    </div>
  );
}
