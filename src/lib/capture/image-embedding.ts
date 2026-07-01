import type { FeatureExtractionPipeline } from "@huggingface/transformers";

import { getMobileNetClassifier } from "./mobilenet-classifier";

const EMBEDDING_DIM = 512;
const MODEL_ID = "Xenova/clip-vit-base-patch32";

let pipelinePromise: Promise<FeatureExtractionPipeline> | null = null;

async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { ensureSingleThreadWasm } = await import("./configure-wasm");
      await ensureSingleThreadWasm();
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      return pipeline("feature-extraction", MODEL_ID);
    })();
  }
  return pipelinePromise;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

/** L2-normalized image embedding for same-cat matching. */
export async function computeImageEmbedding(blob: Blob): Promise<number[]> {
  try {
    const extractor = await getEmbeddingPipeline();
    const dataUrl = await blobToDataUrl(blob);
    const output = await extractor(dataUrl, { pooling: "mean", normalize: true });
    const raw = Array.from(output.data as Float32Array);
    const normalized = l2Normalize(raw);
    if (normalized.length >= EMBEDDING_DIM) {
      return normalized.slice(0, EMBEDDING_DIM);
    }
    return [...normalized, ...Array(EMBEDDING_DIM - normalized.length).fill(0)];
  } catch {
    return colorFallbackEmbedding(blob);
  }
}

async function colorFallbackEmbedding(blob: Blob): Promise<number[]> {
  const vec = new Array(EMBEDDING_DIM).fill(0);
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return vec;
    ctx.drawImage(bitmap, 0, 0, 32, 32);
    const { data } = ctx.getImageData(0, 0, 32, 32);
    for (let i = 0; i < 32 * 32; i++) {
      vec[i % EMBEDDING_DIM] += data[i * 4] / 255;
      vec[(i + 11) % EMBEDDING_DIM] += data[i * 4 + 1] / 255;
      vec[(i + 23) % EMBEDDING_DIM] += data[i * 4 + 2] / 255;
    }
    bitmap.close();
    return l2Normalize(vec);
  } catch {
    return vec;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot;
}

export function preloadImageEmbeddingModel(): void {
  void getEmbeddingPipeline().catch(() => undefined);
  void getMobileNetClassifier().catch(() => undefined);
}
