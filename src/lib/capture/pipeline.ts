import { BG_REMOVAL_CONFIG } from "./preload-capture";
import { runWithSingleThreadWasm } from "./configure-wasm";
import { canvasToBlob } from "./image-utils";
import { addStickerOutline } from "./outline";
import { yieldToMain } from "./yield-to-main";

export type CaptureStage =
  | "compressing"
  | "removing"
  | "outlining"
  | "finishing"
  | "done";

export interface CaptureProgress {
  stage: CaptureStage;
  label: string;
  pct: number;
}

export type ProgressFn = (progress: CaptureProgress) => void;

export interface ProcessedCapture {
  /** Compressed original photo (JPEG). */
  original: Blob;
  /** Outlined transparent sticker (WebP with alpha). */
  sticker: Blob;
  /** Object URL for previewing the sticker. Revoke when done. */
  stickerPreviewUrl: string;
}

/** Max side sent to the matting model — full camera res is slower with no benefit. */
const INFERENCE_MAX_SIDE = 1024;

/**
 * Full on-device pipeline: compress -> background removal -> sticker outline ->
 * compress. All steps run in the browser; the ML model lazy-loads on first use.
 */
export async function processCatPhoto(
  file: File,
  onProgress?: ProgressFn,
): Promise<ProcessedCapture> {
  onProgress?.({ stage: "compressing", label: "Compressing photo…", pct: 5 });
  await yieldToMain();

  const { default: imageCompression } = await import("browser-image-compression");

  const original = await imageCompression(file, {
    maxWidthOrHeight: 1280,
    maxSizeMB: 0.8,
    fileType: "image/jpeg",
    initialQuality: 0.85,
    useWebWorker: true,
  });

  onProgress?.({ stage: "removing", label: "Removing background…", pct: 15 });
  await yieldToMain();

  const inferenceInput = await resizeForMatting(original);
  const { removeBackground } = await import("@imgly/background-removal");

  const cutout = await runWithSingleThreadWasm(() =>
    removeBackground(inferenceInput, {
      ...BG_REMOVAL_CONFIG,
      progress: (_key, current, total) => {
        const pct = 15 + Math.round((current / Math.max(total, 1)) * 55);
        onProgress?.({ stage: "removing", label: "Removing background…", pct });
      },
    }),
  );

  onProgress?.({ stage: "outlining", label: "Adding sticker outline…", pct: 72 });
  await yieldToMain();

  const outlined = await addStickerOutline(cutout);

  onProgress?.({ stage: "finishing", label: "Finishing up…", pct: 88 });
  await yieldToMain();

  const sticker = await imageCompression(
    new File([outlined], "sticker.png", { type: "image/png" }),
    {
      maxWidthOrHeight: 768,
      maxSizeMB: 0.4,
      fileType: "image/webp",
      initialQuality: 0.92,
      useWebWorker: true,
    },
  );

  const stickerPreviewUrl = URL.createObjectURL(sticker);

  onProgress?.({ stage: "done", label: "Done!", pct: 100 });

  return { original, sticker, stickerPreviewUrl };
}

async function resizeForMatting(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, INFERENCE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale >= 0.999) {
    bitmap.close();
    return source;
  }

  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas 2D context unavailable.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvasToBlob(canvas, "image/jpeg", 0.92);
}

export { preloadCaptureAssets } from "./preload-capture";
