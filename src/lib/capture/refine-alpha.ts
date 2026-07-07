import { canvasToBlob } from "./image-utils";

const MAX_REFINE_SIDE = 1280;

/**
 * Light alpha cleanup — trims faint halos and softens jagged fur edges.
 */
export async function refineStickerAlpha(source: Blob): Promise<Blob> {
  const photoBitmap = await createImageBitmap(source);
  const fullWidth = photoBitmap.width;
  const fullHeight = photoBitmap.height;
  const scale = Math.min(
    1,
    MAX_REFINE_SIDE / Math.max(fullWidth, fullHeight),
  );
  const width = Math.max(1, Math.round(fullWidth * scale));
  const height = Math.max(1, Math.round(fullHeight * scale));

  const work = document.createElement("canvas");
  work.width = width;
  work.height = height;
  const ctx = work.getContext("2d");
  if (!ctx) {
    photoBitmap.close();
    throw new Error("Canvas 2D context unavailable.");
  }

  ctx.drawImage(photoBitmap, 0, 0, width, height);
  photoBitmap.close();

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 12) {
      data[i + 3] = 0;
      continue;
    }
    if (a < 48) {
      data[i + 3] = Math.round(a * 0.65);
    }
  }

  blurAlphaChannel(data, width, height, 1);
  ctx.putImageData(imageData, 0, 0);

  if (scale < 1) {
    const full = document.createElement("canvas");
    full.width = fullWidth;
    full.height = fullHeight;
    const fctx = full.getContext("2d");
    if (!fctx) throw new Error("Canvas 2D context unavailable.");
    fctx.drawImage(work, 0, 0, fullWidth, fullHeight);
    return canvasToBlob(full, "image/png");
  }

  return canvasToBlob(work, "image/png");
}

function blurAlphaChannel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): void {
  // Separable box blur: horizontal pass then vertical pass.
  // O(n × r) each direction instead of O(n × r²) for the naive kernel,
  // so for radius=1 on a 1280² image: ~3.3M ops vs ~5M for the old loop.
  const alphas = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    alphas[p] = data[i + 3];
  }

  const tmp = new Float32Array(alphas.length);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let kx = -radius; kx <= radius; kx++) {
        const sx = x + kx;
        if (sx < 0 || sx >= width) continue;
        sum += alphas[y * width + sx];
        count++;
      }
      tmp[y * width + x] = sum / count;
    }
  }

  // Vertical pass into alphas
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        const sy = y + ky;
        if (sy < 0 || sy >= height) continue;
        sum += tmp[sy * width + x];
        count++;
      }
      alphas[y * width + x] = sum / count;
    }
  }

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    data[i + 3] = Math.round(alphas[p]);
  }
}
