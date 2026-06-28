/** Scale a transparent sticker blob (centre-crop canvas, same dimensions). */
export async function scaleStickerBlob(blob: Blob, scale: number): Promise<Blob> {
  if (scale <= 0 || Math.abs(scale - 1) < 0.02) return blob;

  const img = await blobToImage(blob);
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");

  const drawW = width * scale;
  const drawH = height * scale;
  ctx.drawImage(img, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);

  const type = blob.type || "image/webp";
  return canvasToBlob(canvas, type);
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
      reject(new Error("Failed to load sticker."));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export sticker."));
    }, type);
  });
}

export const STICKER_SCALE_MIN = 0.75;
export const STICKER_SCALE_MAX = 2.25;
export const STICKER_SCALE_DEFAULT = 1;
export const STICKER_SCALE_STEP = 0.05;
