"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin } from "lucide-react";
import { toast } from "sonner";

import {
  backfillPlacesAction,
  getStorageEstimateAction,
} from "@/app/(app)/settings/actions";
import { updateAvatarAction } from "@/app/(app)/community/actions";
import { UserAvatar } from "@/components/user-avatar";
import { CatButton } from "@/components/ui/cat-button";
import { uploadAvatar } from "@/lib/community-upload";
import { pendingCaptureCount } from "@/lib/offline-capture-queue";
import { useSettingsStore } from "@/stores/settings";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SettingsForm({
  initialAvatar,
  displayName,
}: {
  initialAvatar?: string | null;
  displayName?: string;
}) {
  const router = useRouter();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const gpsDefaultOn = useSettingsStore((s) => s.gpsDefaultOn);
  const setGpsDefaultOn = useSettingsStore((s) => s.setGpsDefaultOn);
  const [storage, setStorage] = useState<{
    captureCount: number;
    estimatedBytes: number;
    percentUsed: number;
  } | null>(null);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    void getStorageEstimateAction().then(setStorage);
    void pendingCaptureCount().then(setPending);
  }, []);

  async function handleBackfill() {
    const result = await backfillPlacesAction();
    if (!result.success) {
      toast.error(result.error ?? "Could not backfill places.");
      return;
    }
    if (result.updated === 0) {
      toast.info("All mapped catches already have place names.");
    } else {
      toast.success(`Updated ${result.updated} catch${result.updated === 1 ? "" : "es"} with place names.`);
    }
    router.refresh();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file);
      const result = await updateAvatarAction(url);
      if (!result.success) {
        toast.error(result.error ?? "Could not update avatar.");
        return;
      }
      setAvatarUrl(url);
      toast.success("Avatar updated!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-28">
      <header className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-label="Back to profile"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-extrabold text-foreground">Settings</h1>
      </header>

      <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6">
        <UserAvatar
          name={displayName ?? "You"}
          avatarUrl={avatarUrl}
          size="md"
          className="!size-20 text-lg"
        />
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <CatButton
          variant="outline"
          size="sm"
          loading={uploadingAvatar}
          onClick={() => avatarRef.current?.click()}
        >
          Change avatar
        </CatButton>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Location
        </h2>
        <button
          type="button"
          onClick={() => setGpsDefaultOn(!gpsDefaultOn)}
          className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4"
        >
          <span className="flex items-center gap-3">
            <MapPin className="size-5 text-primary" />
            <span className="text-left">
              <span className="block font-semibold text-foreground">
                Tag location by default
              </span>
              <span className="block text-xs text-muted-foreground">
                Turn on GPS when saving new catches
              </span>
            </span>
          </span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              gpsDefaultOn ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
                gpsDefaultOn ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Storage
        </h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          {storage ? (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">Estimated usage</span>
                <span className="font-bold text-primary">{storage.percentUsed}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${storage.percentUsed}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                ~{formatBytes(storage.estimatedBytes)} across {storage.captureCount}{" "}
                catches (Cloudinary free tier ~25 GB)
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading storage estimate…</p>
          )}
          {pending > 0 && (
            <p className="mt-2 text-xs font-semibold text-orange">
              {pending} capture{pending === 1 ? "" : "s"} waiting to sync offline
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Map data
        </h2>
        <p className="text-sm text-muted-foreground">
          Fill in city and country for older catches that have GPS but no place
          name yet.
        </p>
        <CatButton variant="outline" block onClick={handleBackfill}>
          Backfill place names
        </CatButton>
      </section>
    </div>
  );
}
