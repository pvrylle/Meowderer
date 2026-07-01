"use client";

import { useState, useTransition } from "react";
import { Flag, X } from "lucide-react";
import { toast } from "sonner";

import { createReportAction } from "@/app/(app)/community/safety-actions";
import { blockUserAction } from "@/app/(app)/community/safety-actions";
import { REPORT_REASONS } from "@/content/community-guidelines";
import { CatButton } from "@/components/ui/cat-button";
import { PhoneOverlayPortal } from "@/components/phone-overlay-portal";

type ReportTarget = {
  contentType: "post" | "comment" | "chat_message" | "rescue_alert" | "user";
  contentId: string;
  reportedUserId?: string;
  label?: string;
};

export function ReportContentButton({
  target,
  className,
  onBlocked,
}: {
  target: ReportTarget;
  className?: string;
  onBlocked?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]["value"]>("other");
  const [details, setDetails] = useState("");
  const [submitting, startSubmitting] = useTransition();
  const [blocking, setBlocking] = useState(false);

  function handleSubmit() {
    startSubmitting(async () => {
      const result = await createReportAction({
        contentType: target.contentType,
        contentId: target.contentId,
        reportedUserId: target.reportedUserId ?? null,
        reason,
        details: details.trim() || null,
      });
      if (!result.success) {
        toast.error(result.error ?? "Could not submit report.");
        return;
      }
      toast.success("Report submitted. We'll review it.");
      setOpen(false);
      setDetails("");
    });
  }

  async function handleBlock() {
    if (!target.reportedUserId) return;
    setBlocking(true);
    const result = await blockUserAction(target.reportedUserId);
    setBlocking(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not block user.");
      return;
    }
    toast.success("User blocked.");
    setOpen(false);
    onBlocked?.();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        aria-label="Report content"
      >
        <Flag className="size-3.5" />
        Report
      </button>

      {open && (
        <PhoneOverlayPortal>
          <div
            className="absolute inset-0 z-50 flex items-end bg-black/30"
            role="presentation"
            onClick={() => setOpen(false)}
          >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full rounded-t-3xl border border-border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-extrabold text-foreground">Report content</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-full bg-muted"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            {target.label && (
              <p className="mb-3 text-sm text-muted-foreground">{target.label}</p>
            )}
            <fieldset className="space-y-2">
              <legend className="mb-2 text-xs font-bold uppercase text-muted-foreground">
                Reason
              </legend>
              {REPORT_REASONS.map((item) => (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={() => setReason(item.value)}
                  />
                  {item.label}
                </label>
              ))}
            </fieldset>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Optional details…"
              rows={3}
              maxLength={500}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <CatButton block className="mt-4" loading={submitting} onClick={handleSubmit}>
              Submit report
            </CatButton>
            {target.reportedUserId && (
              <CatButton
                variant="outline"
                block
                className="mt-2"
                loading={blocking}
                onClick={handleBlock}
              >
                Block this user
              </CatButton>
            )}
          </div>
        </div>
        </PhoneOverlayPortal>
      )}
    </>
  );
}
