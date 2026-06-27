"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { sendChatAction } from "@/app/(app)/community/actions";
import { cn } from "@/lib/utils";

type ChatMessageRow = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name: string;
  channel: string;
};

const CHANNELS = [
  { key: "general", label: "General" },
  { key: "cat_care", label: "Cat Care", badge: 0 },
  { key: "rescue", label: "Rescue", badge: 0 },
  { key: "shelters", label: "Shelters" },
] as const;

type CommunityChatProps = {
  messages: ChatMessageRow[];
  currentUserId: string;
};

export function CommunityChat({ messages, currentUserId }: CommunityChatProps) {
  const router = useRouter();
  const [channel, setChannel] = useState("general");
  const [draft, setDraft] = useState("");

  const filtered = messages.filter((m) => m.channel === channel);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const result = await sendChatAction({ body: draft, channel });
    if (!result.success) {
      toast.error(result.error ?? "Could not send.");
      return;
    }
    setDraft("");
    router.refresh();
  }

  return (
    <div className="flex min-h-[420px] flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CHANNELS.map((ch) => (
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
          </button>
        ))}
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
                className={cn("flex flex-col gap-0.5", mine && "items-end")}
              >
                {!mine && (
                  <span className="text-xs font-bold text-foreground">
                    {msg.author_name}
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground",
                  )}
                >
                  {msg.body}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
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
          aria-label="Send"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
