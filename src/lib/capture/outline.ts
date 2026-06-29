import { canvasToBlob } from "./image-utils";

const MAX_OUTLINE_SIDE = 1280;
const OUTLINE_STEPS = 16;

/**
 * Turns a transparent cutout into a sticker by drawing a soft white border
 * around its silhouette (alpha dilation), then the original on top.
 */
export async function addStickerOutline(
  cutout: Blob,
  strokeWidth = 12,
): Promise<Blob> {
  const bitmap = await createImageBitmap(cutout);
  const scale = Math.min(
    1,
    MAX_OUTLINE_SIDE / Math.max(bitmap.width, bitmap.height),
  );
  const drawW = Math.max(1, Math.round(bitmap.width * scale));
  const drawH = Math.max(1, Math.round(bitmap.height * scale));
  const stroke = Math.max(4, Math.round(strokeWidth * scale));
  const pad = stroke + 4;

  const width = drawW + pad * 2;
  const height = drawH + pad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas 2D context unavailable.");
  }

  const silhouette = document.createElement("canvas");
  silhouette.width = width;
  silhouette.height = height;
  const sctx = silhouette.getContext("2d");
  if (!sctx) {
    bitmap.close();
    throw new Error("Canvas 2D context unavailable.");
  }

  sctx.drawImage(bitmap, pad, pad, drawW, drawH);
  sctx.globalCompositeOperation = "source-in";
  sctx.fillStyle = "#ffffff";
  sctx.fillRect(0, 0, width, height);

  for (let i = 0; i < OUTLINE_STEPS; i++) {
    const angle = (i / OUTLINE_STEPS) * Math.PI * 2;
    ctx.drawImage(
      silhouette,
      Math.cos(angle) * stroke,
      Math.sin(angle) * stroke,
    );
  }

  ctx.drawImage(bitmap, pad, pad, drawW, drawH);
  bitmap.close();

  return canvasToBlob(canvas, "image/png");
}
