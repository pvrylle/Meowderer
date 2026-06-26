/**
 * Turns a transparent cutout into a sticker by drawing a soft white border
 * around its silhouette (alpha dilation), then the original on top.
 */
export async function addStickerOutline(
  cutout: Blob,
  strokeWidth = 14,
): Promise<Blob> {
  const img = await blobToImage(cutout);

  const pad = strokeWidth + 6;
  const width = img.naturalWidth + pad * 2;
  const height = img.naturalHeight + pad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");

  // 1) Build a solid white silhouette of the cutout on a scratch canvas.
  const silhouette = document.createElement("canvas");
  silhouette.width = width;
  silhouette.height = height;
  const sctx = silhouette.getContext("2d");
  if (!sctx) throw new Error("Canvas 2D context unavailable.");
  sctx.drawImage(img, pad, pad);
  sctx.globalCompositeOperation = "source-in";
  sctx.fillStyle = "#ffffff";
  sctx.fillRect(0, 0, width, height);

  // 2) Stamp the silhouette around a circle to dilate the alpha -> white border.
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const dx = Math.cos(angle) * strokeWidth;
    const dy = Math.sin(angle) * strokeWidth;
    ctx.drawImage(silhouette, dx, dy);
  }

  // 3) Draw the original cutout on top.
  ctx.drawImage(img, pad, pad);

  return canvasToBlob(canvas, "image/png");
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export canvas."));
    }, type);
  });
}
