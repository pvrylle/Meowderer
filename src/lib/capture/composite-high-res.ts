import { canvasToBlob } from "./image-utils";

/**
 * Apply a low-res matting mask to a full-resolution photo so fur and edges
 * stay sharp while inference still runs on a smaller image.
 */
export async function compositeWithHighResMask(
  photo: Blob,
  maskCutout: Blob,
  options?: { edgeBlurPx?: number },
): Promise<Blob> {
  const edgeBlurPx = options?.edgeBlurPx ?? 1;

  const photoBitmap = await createImageBitmap(photo);
  const maskBitmap = await createImageBitmap(maskCutout);

  const width = photoBitmap.width;
  const height = photoBitmap.height;

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) {
    photoBitmap.close();
    maskBitmap.close();
    throw new Error("Canvas 2D context unavailable.");
  }

  if (edgeBlurPx > 0) {
    maskCtx.filter = `blur(${edgeBlurPx}px)`;
  }
  maskCtx.drawImage(maskBitmap, 0, 0, width, height);
  maskCtx.filter = "none";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    photoBitmap.close();
    maskBitmap.close();
    throw new Error("Canvas 2D context unavailable.");
  }

  ctx.drawImage(photoBitmap, 0, 0, width, height);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  photoBitmap.close();
  maskBitmap.close();

  return canvasToBlob(canvas, "image/png");
}
