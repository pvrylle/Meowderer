import type { ImageClassificationPipeline } from "@huggingface/transformers";

let pipelinePromise: Promise<ImageClassificationPipeline> | null = null;

export async function getMobileNetClassifier(): Promise<ImageClassificationPipeline> {
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

export function preloadMobileNet(): void {
  void getMobileNetClassifier().catch(() => undefined);
}
