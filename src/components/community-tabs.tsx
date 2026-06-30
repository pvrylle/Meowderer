"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Building2, ChevronRight } from "lucide-react";

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
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">Community</h1>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/community/alerts"
          className="flex items-center justify-between rounded-xl bg-destructive/10 p-3 ring-1 ring-destructive/20"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">Alerts</p>
              <p className="text-xs text-destructive">{urgentCount} urgent</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          href="/map"
          className="flex items-center justify-between rounded-xl bg-green/10 p-3 ring-1 ring-green/20"
        >
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-green" />
            <div>
              <p className="text-sm font-medium text-foreground">Shelters</p>
              <p className="text-xs text-green">
                {shelterCount != null ? `${shelterCount} nearby` : "View map"}
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(["feed", "chat"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium capitalize transition-colors",
              tab === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "feed" ? (
        <CommunityFeed posts={posts} currentUserId={currentUserId} />
      ) : (
        <CommunityChat
          initialMessages={messages}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
