import { resizeBlobForInference } from "./image-utils";
import {
  getMobileNetClassifier,
  preloadMobileNet,
  resetMobileNetClassifier,
  type MobileNetClassifier,
} from "./mobilenet-classifier";

/** Minimum model confidence to accept a cat label. */
const MIN_CAT_SCORE = 0.08;

/** Reject humans when clearly a portrait and no cat signal. */
const HUMAN_REJECT_SCORE = 0.12;

const CAT_KEYWORDS = [
  "tabby",
  "tiger cat",
  "persian cat",
  "siamese cat",
  "egyptian cat",
  "maine coon",
  "kitten",
  "lynx",
  "cougar",
  "madagascar cat",
  "wildcat",
];

const HUMAN_KEYWORDS = [
  "person",
  "man",
  "woman",
  "boy",
  "girl",
  "human",
  "bridegroom",
  "groom",
  "nun",
  "nurse",
  "chef",
  "student",
  "baby",
  "child",
];

/** Hard reject — never a cat photo. (Phone/screen excluded — cats on screens are valid.) */
const NON_CAT_KEYWORDS = [
  "dog",
  "puppy",
  "car",
  "truck",
  "bus",
  "bicycle",
  "motorcycle",
  "bird",
  "horse",
  "cow",
  "sheep",
  "elephant",
  "bear",
  "computer",
  "laptop",
  "keyboard",
  "food",
  "pizza",
  "building",
  "house",
  "tree",
  "flower",
  "book",
  "chair",
  "table",
];

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function runClassifier(
  classify: MobileNetClassifier,
  blob: Blob,
): Promise<{ label: string; score: number }[]> {
  const dataUrl = await blobToDataUrl(blob);
  try {
    return await classify(dataUrl, { top_k: 10 });
  } catch {
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await classify(objectUrl, { top_k: 10 });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function matchesKeyword(label: string, keywords: string[]): boolean {
  const lower = label.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function labelLooksLikeCat(label: string): boolean {
  const lower = label.toLowerCase();
  if (matchesKeyword(label, CAT_KEYWORDS)) return true;
  return /\bcat\b/.test(lower);
}

function labelLooksHuman(label: string): boolean {
  return matchesKeyword(label, HUMAN_KEYWORDS);
}

function labelLooksNonCat(label: string): boolean {
  return matchesKeyword(label, NON_CAT_KEYWORDS);
}

function friendlyLabel(label: string): string {
  return label.replace(/_/g, " ").split(",")[0]?.trim() ?? label;
}

function bestScore(
  results: { label: string; score: number }[],
  matcher: (label: string) => boolean,
): number {
  let best = 0;
  for (const r of results) {
    if (matcher(r.label)) best = Math.max(best, r.score);
  }
  return best;
}

function evaluateResults(
  results: { label: string; score: number }[],
): CatGuardResult {
  const catScore = bestScore(results, labelLooksLikeCat);
  const humanScore = bestScore(results, labelLooksHuman);

  const catHit = results.find(
    (r) => r.score >= MIN_CAT_SCORE && labelLooksLikeCat(r.label),
  );

  const catInTopFive = results
    .slice(0, 5)
    .some((r) => labelLooksLikeCat(r.label) && r.score >= MIN_CAT_SCORE);

  if (catHit && (catHit.score > humanScore || catInTopFive)) {
    return {
      ok: true,
      confidence: catHit.score,
      label: friendlyLabel(catHit.label),
    };
  }

  if (
    humanScore >= HUMAN_REJECT_SCORE &&
    humanScore >= catScore &&
    catScore < MIN_CAT_SCORE
  ) {
    return {
      ok: false,
      reason: "That's a person, not a cat — try a kitty photo!",
    };
  }

  const nonCatHit = results.find(
    (r) =>
      r.score > 0.22 &&
      labelLooksNonCat(r.label) &&
      !labelLooksLikeCat(r.label),
  );
  if (nonCatHit && catScore < MIN_CAT_SCORE) {
    return {
      ok: false,
      reason: `That looks like a ${friendlyLabel(nonCatHit.label)} — try a cat photo!`,
    };
  }

  const top = results[0];
  if (
    top &&
    top.score > 0.35 &&
    !labelLooksLikeCat(top.label) &&
    catScore < MIN_CAT_SCORE
  ) {
    return {
      ok: false,
      reason: `That looks like a ${friendlyLabel(top.label)} — try a cat photo!`,
    };
  }

  if (catScore >= MIN_CAT_SCORE) {
    return { ok: true, confidence: catScore, label: "cat" };
  }

  return {
    ok: false,
    reason: "We couldn't spot a cat — try a clearer photo of a kitty.",
  };
}

export type CatGuardResult =
  | { ok: true; confidence: number; label?: string }
  | { ok: false; reason: string };

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

function isSkinPixel(r: number, g: number, b: number): boolean {
  const { h, s, v } = rgbToHsv(r, g, b);
  return h <= 50 && s >= 0.12 && s <= 0.72 && v >= 0.28 && v <= 0.96;
}

/** Last-resort check when MobileNet cannot load (offline / blocked CDN). */
async function heuristicCatCheck(blob: Blob): Promise<CatGuardResult> {
  try {
    const bitmap = await createImageBitmap(blob);
    const size = 96;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return { ok: true, confidence: 0.35, label: "photo" };
    }

    const scale = Math.min(size / bitmap.width, size / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
    bitmap.close();

    const { data } = ctx.getImageData(0, 0, size, size);
    let skin = 0;
    let dark = 0;
    let colorful = 0;
    let total = 0;

    for (let y = size * 0.2; y < size * 0.8; y++) {
      for (let x = size * 0.2; x < size * 0.8; x++) {
        const i = (Math.floor(y) * size + Math.floor(x)) * 4;
        const a = data[i + 3];
        if (a < 40) continue;
        total++;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const { h: hue, s, v } = rgbToHsv(r, g, b);
        if (isSkinPixel(r, g, b)) skin++;
        if (v < 0.18) dark++;
        if (s > 0.28 && v > 0.2) colorful++;
        if (hue >= 10 && hue <= 45 && s > 0.25) colorful++;
      }
    }

    if (total === 0) {
      return { ok: false, reason: "We couldn't read that photo — try again." };
    }

    const skinRatio = skin / total;
    const darkRatio = dark / total;
    const colorRatio = colorful / total;

    if (skinRatio > 0.42 && colorRatio < 0.35) {
      return {
        ok: false,
        reason: "That's a person, not a cat — try a kitty photo!",
      };
    }

    if (darkRatio > 0.72) {
      return {
        ok: false,
        reason: "Photo is too dark — try better lighting on the kitty.",
      };
    }

    return { ok: true, confidence: 0.4, label: "photo" };
  } catch {
    return { ok: true, confidence: 0.3, label: "photo" };
  }
}

/**
 * On-device "is this a cat?" check using MobileNet (TensorFlow.js).
 */
export async function isLikelyCat(file: File): Promise<CatGuardResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        resetMobileNetClassifier();
        preloadMobileNet();
        await new Promise((r) => setTimeout(r, 400));
      }

      const thumb = await resizeBlobForInference(file, 224);
      const classify = await getMobileNetClassifier();
      const results = await runClassifier(classify, thumb);
      return evaluateResults(results);
    } catch (err) {
      lastError = err;
      console.warn("[cat-guard] attempt failed:", err);
    }
  }

  console.warn("[cat-guard] all attempts failed:", lastError);
  const thumb = await resizeBlobForInference(file, 224);
  return heuristicCatCheck(thumb);
}

export { preloadCoatClassifier } from "./classify-coat";
export { preloadCaptureAssets } from "./preload-capture";
export { preloadMobileNet } from "./mobilenet-classifier";
