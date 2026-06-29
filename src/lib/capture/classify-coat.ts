import type { CoatType } from "@/lib/coat-rarity";

import { getMobileNetClassifier } from "./mobilenet-classifier";

export type CoatClassification = {
  coat_type: CoatType;
  confidence: number;
  source: "transformers" | "color";
};

const IMAGENET_CAT_LABELS: Record<string, CoatType> = {
  "tabby, tiger cat": "brown tabby",
  "tiger cat": "brown tabby",
  "tabby": "gray tabby",
  "Persian cat": "gray",
  "Siamese cat, Siamese": "pointed",
  "Egyptian cat": "gray",
  "Maine coon": "brown tabby",
  "Angora, Angora rabbit": "white",
};

const CAT_KEYWORDS = [
  "cat",
  "tabby",
  "tiger cat",
  "Persian",
  "Siamese",
  "Egyptian",
  "Maine coon",
  "Angora",
];

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function classifyWithTransformers(
  blob: Blob,
): Promise<CoatClassification | null> {
  try {
    const classify = await getMobileNetClassifier();
    const dataUrl = await blobToDataUrl(blob);
    const results = await classify(dataUrl, { top_k: 5 });

    for (const { label, score } of results) {
      const mapped = IMAGENET_CAT_LABELS[label];
      if (mapped && score > 0.08) {
        return {
          coat_type: mapped,
          confidence: score,
          source: "transformers",
        };
      }
    }

    const catHit = results.find(
      (r) =>
        r.score > 0.05 &&
        CAT_KEYWORDS.some((kw) => r.label.toLowerCase().includes(kw.toLowerCase())),
    );
    if (catHit) {
      return {
        coat_type: "gray tabby",
        confidence: catHit.score,
        source: "transformers",
      };
    }
  } catch {
    // Model unavailable — fall back to color analysis.
  }
  return null;
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

/** Analyze non-transparent sticker pixels to infer coat color/pattern. */
async function classifyFromColors(blob: Blob): Promise<CoatClassification> {
  const bitmap = await createImageBitmap(blob);
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { coat_type: "gray tabby", confidence: 0.3, source: "color" };
  }

  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, size, size);

  let dark = 0;
  let light = 0;
  let orange = 0;
  let brown = 0;
  let gray = 0;
  let colorful = 0;
  let total = 0;

  const hueBuckets = new Set<number>();

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 40) continue;
    total++;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const { h, s, v } = rgbToHsv(r, g, b);

    if (v < 0.22) dark++;
    if (v > 0.78 && s < 0.2) light++;

    if (s > 0.35 && v > 0.25) {
      hueBuckets.add(Math.floor(h / 30));
      colorful++;
    }

    if (h >= 10 && h <= 45 && s > 0.35 && v > 0.3) orange++;
    if (h >= 15 && h <= 40 && s > 0.2 && s < 0.55 && v > 0.2 && v < 0.65)
      brown++;
    if (s < 0.18 && v > 0.25 && v < 0.75) gray++;
  }

  if (total === 0) {
    return { coat_type: "gray tabby", confidence: 0.2, source: "color" };
  }

  const pct = (n: number) => n / total;

  if (hueBuckets.size >= 4 && pct(colorful) > 0.25) {
    const coat: CoatType =
      pct(orange) > 0.08 ? "calico" : "tortoiseshell";
    return { coat_type: coat, confidence: 0.65, source: "color" };
  }

  if (pct(dark) > 0.35 && pct(light) > 0.25) {
    return { coat_type: "tuxedo", confidence: 0.7, source: "color" };
  }

  if (pct(orange) > 0.2) {
    return { coat_type: "ginger", confidence: 0.75, source: "color" };
  }

  if (pct(brown) > 0.15) {
    return { coat_type: "brown tabby", confidence: 0.65, source: "color" };
  }

  if (pct(gray) > 0.35) {
    return { coat_type: "gray tabby", confidence: 0.6, source: "color" };
  }

  if (pct(dark) > 0.55) {
    return { coat_type: "black", confidence: 0.7, source: "color" };
  }

  if (pct(light) > 0.55) {
    return { coat_type: "white", confidence: 0.7, source: "color" };
  }

  if (pct(gray) > 0.2) {
    return { coat_type: "gray", confidence: 0.55, source: "color" };
  }

  return { coat_type: "gray tabby", confidence: 0.45, source: "color" };
}

/** Classify coat from a transparent sticker blob (client-side). */
export async function classifyCoat(blob: Blob): Promise<CoatClassification> {
  const fromMl = await classifyWithTransformers(blob);
  if (fromMl) return fromMl;
  return classifyFromColors(blob);
}

/** Pre-warm the Transformers.js model (optional, e.g. on catch page mount). */
export function preloadCoatClassifier(): void {
  void getMobileNetClassifier().catch(() => undefined);
}
