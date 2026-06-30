"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { sendChatAction } from "@/app/(app)/community/actions";
import { ReportContentButton } from "@/components/report-content-button";
import { UserAvatar } from "@/components/user-avatar";
import type { ChatMessageWithAuthor } from "@/lib/community";
import { formatChatTime } from "@/lib/format-time";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { key: "general", label: "General" },
  { key: "cat_care", label: "Cat Care" },
  { key: "rescue", label: "Rescue" },
  { key: "shelters", label: "Shelters" },
] as const;

const READ_KEY = "catdex-chat-read";

type ChatMessageRow = ChatMessageWithAuthor;

type CommunityChatProps = {
  initialMessages: ChatMessageRow[];
  currentUserId: string;
};

function getLastRead(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) ?? "{}") as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

function setLastRead(channel: string) {
  const all = getLastRead();
  all[channel] = new Date().toISOString();
  localStorage.setItem(READ_KEY, JSON.stringify(all));
}

function countUnread(
  channel: string,
  messages: ChatMessageRow[],
  activeChannel: string,
): number {
  if (channel === activeChannel) return 0;
  const lastRead = getLastRead()[channel];
  if (!lastRead) return messages.filter((m) => m.channel === channel).length;
  return messages.filter(
    (m) => m.channel === channel && m.created_at > lastRead,
  ).length;
}

export function CommunityChat({
  initialMessages,
  currentUserId,
}: CommunityChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [channel, setChannel] = useState("general");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const filtered = messages.filter((m) => m.channel === channel);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [channel, filtered.length, scrollToBottom]);

  useEffect(() => {
    setLastRead(channel);
  }, [channel, messages.length]);

  useEffect(() => {
    const supabase = createClient();
    const sub = supabase
      .channel("community-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const row = payload.new as ChatMessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, { ...row, hidden_at: row.hidden_at ?? null, author_name: "Cat lover", author_avatar: null }];
          });
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", row.user_id)
            .single();
          if (profile) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === row.id
                  ? {
                      ...m,
                      author_name: profile.username ?? "Cat lover",
                      author_avatar: profile.avatar_url,
                    }
                  : m,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(sub);
    };
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const result = await sendChatAction({ body: draft, channel });
    setSending(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not send.");
      return;
    }
    if (result.message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === result.message!.id)) return prev;
        return [...prev, result.message!];
      });
    }
    setDraft("");
  }

  return (
    <div className="flex min-h-[420px] flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CHANNELS.map((ch) => {
          const unread = countUnread(ch.key, messages, channel);
          return (
            <button
              key={ch.key}
              type="button"
              onClick={() => setChannel(ch.key)}
              className={cn(
                "relative shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
                channel === ch.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground",
              )}
            >
              {ch.label}
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card/50 p-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages in #{channel.replace("_", "-")} yet. Say hi!
          </p>
        ) : (
          filtered.map((msg) => {
            const mine = msg.user_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn("flex gap-2", mine && "flex-row-reverse")}
              >
                {!mine && (
                  <UserAvatar
                    name={msg.author_name}
                    avatarUrl={msg.author_avatar}
                    size="sm"
                  />
                )}
                <div
                  className={cn(
                    "flex max-w-[85%] flex-col gap-0.5",
                    mine && "items-end",
                  )}
                >
                  {!mine && (
                    <span className="text-xs font-bold text-foreground">
                      {msg.author_name}
                    </span>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm shadow-sm",
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground",
                    )}
                  >
                    {msg.body}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatChatTime(msg.created_at)}
                  </span>
                  {!mine && (
                    <ReportContentButton
                      target={{
                        contentType: "chat_message",
                        contentId: msg.id,
                        reportedUserId: msg.user_id,
                        label: msg.body.slice(0, 80),
                      }}
                      className="text-[10px] font-semibold text-muted-foreground hover:text-destructive"
                      onBlocked={() => {
                        setMessages((prev) =>
                          prev.filter((m) => m.user_id !== msg.user_id),
                        );
                        router.refresh();
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message #${channel.replace("_", "-")}…`}
          className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={sending}
          aria-label="Send"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
