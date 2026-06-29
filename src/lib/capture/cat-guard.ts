import { resizeBlobForInference } from "./image-utils";
import { getMobileNetClassifier } from "./mobilenet-classifier";

const CAT_KEYWORDS = [
  "cat",
  "tabby",
  "tiger cat",
  "persian",
  "siamese",
  "egyptian",
  "maine coon",
  "kitten",
];

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export type CatGuardResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Lightweight "is this a cat?" check before running bg removal.
 * Uses Transformers.js MobileNet; passes through if the model fails to load.
 */
export async function isLikelyCat(file: File): Promise<CatGuardResult> {
  try {
    const thumb = await resizeBlobForInference(file, 384);
    const classify = await getMobileNetClassifier();
    const dataUrl = await fileToDataUrl(thumb);
    const results = await classify(dataUrl, { top_k: 5 });

    const catHit = results.find(
      (r) =>
        r.score > 0.04 &&
        CAT_KEYWORDS.some((kw) => r.label.toLowerCase().includes(kw)),
    );

    if (catHit) return { ok: true };

    const top = results[0];
    if (top && top.score > 0.35) {
      return {
        ok: false,
        reason: `That looks like a ${top.label.replace(/_/g, " ")} — try a cat photo!`,
      };
    }

    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export { preloadCoatClassifier } from "./classify-coat";
export { preloadCaptureAssets } from "./preload-capture";
export { preloadMobileNet } from "./mobilenet-classifier";
