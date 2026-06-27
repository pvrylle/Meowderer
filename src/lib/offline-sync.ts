import { saveCapture } from "@/app/catch/actions";
import { uploadCapture } from "@/lib/capture/upload";
import {
  listPendingCaptures,
  removePendingCapture,
  type PendingCapture,
} from "@/lib/offline-capture-queue";
import type { Rarity } from "@/lib/supabase/types";

let draining = false;

export type DrainResult = {
  synced: number;
  failed: number;
  errors: string[];
};

async function syncOnePending(item: PendingCapture): Promise<void> {
  const uploaded = await uploadCapture(item.photoBlob, item.stickerBlob);
  const saveResult = await saveCapture({
    captureId: uploaded.captureId,
    photoUrl: uploaded.photoUrl,
    stickerUrl: uploaded.stickerUrl,
    nickname: item.nickname,
    lat: item.lat,
    lng: item.lng,
    coat_type: item.coat_type,
    rarity: (item.rarity as Rarity | null) ?? null,
  });

  if (!saveResult.success) {
    throw new Error(saveResult.error);
  }
}

export async function drainPendingCaptures(): Promise<DrainResult> {
  if (draining) {
    return { synced: 0, failed: 0, errors: ["Sync already in progress."] };
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0, errors: ["You are offline."] };
  }

  draining = true;
  const result: DrainResult = { synced: 0, failed: 0, errors: [] };

  try {
    const pending = await listPendingCaptures();
    for (const item of pending) {
      try {
        await syncOnePending(item);
        await removePendingCapture(item.id);
        result.synced++;
      } catch (err) {
        result.failed++;
        result.errors.push(
          err instanceof Error ? err.message : "Upload failed.",
        );
      }
    }
  } finally {
    draining = false;
  }

  return result;
}
