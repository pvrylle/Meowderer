import { BG_REMOVAL_CONFIG } from "./preload-capture";
import { compositeWithHighResMask } from "./composite-high-res";
import { runWithSingleThreadWasm, ensureWasmSingleThread } from "./configure-wasm";
import { canvasToBlob } from "./image-utils";
import { addStickerOutline } from "./outline";
import { refineStickerAlpha } from "./refine-alpha";
import { yieldToMain } from "./yield-to-main";

export type CaptureStage =
  | "compressing"
  | "removing"
  | "refining"
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

/**
 * Max side sent to the matting model. 768 vs 1024 is a 44% pixel-count
 * reduction (768² = 589k vs 1024² = 1048k) → ~30–40% faster inference.
 * Quality is identical because the mask is composited back onto the full-res
 * original in compositeWithHighResMask.
 */
const INFERENCE_MAX_SIDE = 768;

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

  // Compress the original and prepare the inference input simultaneously —
  // both are independent transforms of the same source file.
  const [original, inferenceInput] = await Promise.all([
    imageCompression(file, {
      maxWidthOrHeight: 1280,
      maxSizeMB: 0.8,
      fileType: "image/jpeg",
      initialQuality: 0.85,
      useWebWorker: true,
    }),
    resizeForMatting(file),
  ]);

  onProgress?.({ stage: "removing", label: "Removing background…", pct: 15 });
  await yieldToMain();

  await ensureWasmSingleThread();
  const { removeBackground } = await import("@imgly/background-removal");

  const cutout = await runWithSingleThreadWasm(() =>
    removeBackground(inferenceInput, {
      ...BG_REMOVAL_CONFIG,
      progress: (_key, current, total) => {
        const pct = 15 + Math.round((current / Math.max(total, 1)) * 50);
        onProgress?.({ stage: "removing", label: "Removing background…", pct });
      },
    }),
  );

  onProgress?.({ stage: "refining", label: "Sharpening edges…", pct: 68 });
  await yieldToMain();

  // edgeBlurPx=0: skip the redundant composite blur — refineStickerAlpha
  // already smooths edges, so the extra blur pass just adds latency.
  const composited = await compositeWithHighResMask(original, cutout, {
    edgeBlurPx: 0,
  });
  let refined = composited;
  try {
    refined = await refineStickerAlpha(composited);
  } catch {
    // Fall back to composited cutout if alpha cleanup fails on this device.
  }

  onProgress?.({ stage: "outlining", label: "Adding sticker outline…", pct: 78 });
  await yieldToMain();

  const outlined = await addStickerOutline(refined, { shadow: true });

  onProgress?.({ stage: "finishing", label: "Finishing up…", pct: 88 });
  await yieldToMain();

  const sticker = await imageCompression(
    new File([outlined], "sticker.png", { type: "image/png" }),
    {
      maxWidthOrHeight: 1024,
      maxSizeMB: 0.5,
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
