import { runWithSingleThreadWasm } from "./configure-wasm";
import { addStickerOutline } from "./outline";

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

/**
 * Full on-device pipeline: compress -> background removal -> sticker outline ->
 * compress. All steps run in the browser; the ML model lazy-loads on first use.
 */
export async function processCatPhoto(
  file: File,
  onProgress?: ProgressFn,
): Promise<ProcessedCapture> {
  onProgress?.({ stage: "compressing", label: "Compressing photo…", pct: 5 });

  const { default: imageCompression } = await import("browser-image-compression");

  const original = await imageCompression(file, {
    maxWidthOrHeight: 1280,
    maxSizeMB: 0.8,
    fileType: "image/jpeg",
    initialQuality: 0.8,
    useWebWorker: false,
  });

  onProgress?.({ stage: "removing", label: "Removing background…", pct: 20 });

  const { removeBackground } = await import("@imgly/background-removal");

  const cutout = await runWithSingleThreadWasm(() =>
    removeBackground(file, {
      progress: (_key, current, total) => {
        const pct = 20 + Math.round((current / Math.max(total, 1)) * 50);
        onProgress?.({ stage: "removing", label: "Removing background…", pct });
      },
    }),
  );

  onProgress?.({ stage: "outlining", label: "Adding sticker outline…", pct: 75 });

  const outlined = await addStickerOutline(cutout);

  onProgress?.({ stage: "finishing", label: "Finishing up…", pct: 90 });

  const sticker = await imageCompression(
    new File([outlined], "sticker.png", { type: "image/png" }),
    {
      maxWidthOrHeight: 768,
      maxSizeMB: 0.4,
      fileType: "image/webp",
      initialQuality: 0.9,
      useWebWorker: false,
    },
  );

  const stickerPreviewUrl = URL.createObjectURL(sticker);

  onProgress?.({ stage: "done", label: "Done!", pct: 100 });

  return { original, sticker, stickerPreviewUrl };
}
