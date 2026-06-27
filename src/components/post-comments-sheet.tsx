"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import {
  addCommentAction,
  getCommentsAction,
} from "@/app/(app)/community/actions";
import { UserAvatar } from "@/components/user-avatar";
import { CatButton } from "@/components/ui/cat-button";
import type { CommentWithAuthor } from "@/lib/community";

type PostCommentsSheetProps = {
  postId: string | null;
  onClose: () => void;
  onCommentAdded: () => void;
};

export function PostCommentsSheet({
  postId,
  onClose,
  onCommentAdded,
}: PostCommentsSheetProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    const result = await getCommentsAction(postId);
    setLoading(false);
    if (result.success) setComments(result.comments);
  }, [postId]);

  useEffect(() => {
    if (postId) void load();
    else setComments([]);
  }, [postId, load]);

  useEffect(() => {
    if (!postId) return;
    inputRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [postId, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!postId || !draft.trim()) return;
    setSubmitting(true);
    const result = await addCommentAction({ postId, body: draft.trim() });
    setSubmitting(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not comment.");
      return;
    }
    setDraft("");
    onCommentAdded();
    void load();
  }

  if (!postId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/30"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="comments-sheet-title"
        className="flex max-h-[75vh] w-full flex-col rounded-t-3xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="comments-sheet-title" className="font-extrabold text-foreground">
            Comments
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close comments"
            onClick={onClose}
            className="flex size-11 min-h-11 min-w-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <UserAvatar
                    name={c.author_name}
                    avatarUrl={c.author_avatar}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {c.author_name}
                    </p>
                    <p className="text-sm text-foreground">{c.body}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 border-t border-border p-4"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            aria-label="Comment text"
            className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <CatButton type="submit" size="sm" loading={submitting}>
            Post
          </CatButton>
        </form>
      </div>
    </div>
  );
}
