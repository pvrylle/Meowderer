"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import {
  addCommentAction,
  getCommentsAction,
} from "@/app/(app)/community/actions";
import { deleteCommentAction } from "@/app/(app)/community/safety-actions";
import { ReportContentButton } from "@/components/report-content-button";
import { UserAvatar } from "@/components/user-avatar";
import { CatButton } from "@/components/ui/cat-button";
import { PhoneOverlayPortal } from "@/components/phone-overlay-portal";
import type { CommentWithAuthor } from "@/lib/community";
import { formatRelativeTime } from "@/lib/format-time";

type PostCommentsSheetProps = {
  postId: string | null;
  currentUserId: string;
  onClose: () => void;
  onCommentAdded: () => void;
};

export function PostCommentsSheet({
  postId,
  currentUserId,
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

  async function handleDelete(commentId: string) {
    const result = await deleteCommentAction(commentId);
    if (!result.success) {
      toast.error(result.error ?? "Could not delete comment.");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    onCommentAdded();
  }

  if (!postId) return null;

  return (
    <PhoneOverlayPortal>
      <div
        className="absolute inset-0 flex items-end bg-black/30"
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-foreground">
                        {c.author_name}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        {c.user_id !== currentUserId && (
                          <ReportContentButton
                            target={{
                              contentType: "comment",
                              contentId: c.id,
                              reportedUserId: c.user_id,
                            }}
                            className="text-[10px] font-semibold text-muted-foreground hover:text-destructive"
                          />
                        )}
                        {c.user_id === currentUserId && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="text-[10px] font-semibold text-muted-foreground hover:text-destructive"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground">{c.body}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(c.created_at)}
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
    </PhoneOverlayPortal>
  );
}
