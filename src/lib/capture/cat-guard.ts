import type { ImageClassificationPipeline } from "@huggingface/transformers";

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

let pipelinePromise: Promise<ImageClassificationPipeline> | null = null;

async function getClassifier(): Promise<ImageClassificationPipeline> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { ensureSingleThreadWasm } = await import("./configure-wasm");
      await ensureSingleThreadWasm();
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      return pipeline("image-classification", "Xenova/mobilenet_v1_1.0_224");
    })();
  }
  return pipelinePromise;
}

function fileToDataUrl(file: File): Promise<string> {
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
    const classify = await getClassifier();
    const dataUrl = await fileToDataUrl(file);
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
