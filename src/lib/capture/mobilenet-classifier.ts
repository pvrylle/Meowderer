export type ClassificationResult = { label: string; score: number }[];

export type MobileNetClassifier = (
  input: string,
  options?: { top_k?: number },
) => Promise<ClassificationResult>;

let classifierPromise: Promise<MobileNetClassifier> | null = null;

export function resetMobileNetClassifier(): void {
  classifierPromise = null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for classification."));
    img.src = src;
  });
}

/**
 * Pick a backend that produces correct math. Some mobile GPUs return
 * constant/garbage output on WebGL (every image → same label), so we verify
 * WebGL works and fall back to CPU when it doesn't.
 */
async function selectBackend(tf: typeof import("@tensorflow/tfjs")): Promise<void> {
  try {
    await tf.setBackend("webgl");
    await tf.ready();

    // Sanity check: sum of a known tensor must be finite and correct.
    const probe = tf.tidy(() => tf.tensor1d([1, 2, 3, 4]).sum());
    const value = (await probe.data())[0];
    probe.dispose();

    if (Number.isFinite(value) && Math.abs(value - 10) < 1e-3) {
      return;
    }
  } catch {
    // fall through to CPU
  }

  await tf.setBackend("cpu");
  await tf.ready();
}

export async function getMobileNetClassifier(): Promise<MobileNetClassifier> {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const [mobilenet, tf] = await Promise.all([
        import("@tensorflow-models/mobilenet"),
        import("@tensorflow/tfjs"),
      ]);

      await selectBackend(tf);

      // v2 is far more accurate than v1 — fixes cats getting mislabeled.
      const model = await mobilenet.load({ version: 2, alpha: 1.0 });

      return async (input: string, options?: { top_k?: number }) => {
        const img = await loadImage(input);
        try {
          const topK = options?.top_k ?? 5;
          const predictions = await model.classify(img, topK);
          return predictions.map((p) => ({
            label: p.className,
            score: p.probability,
          }));
        } finally {
          img.src = "";
        }
      };
    })();
  }
  return classifierPromise;
}

export function preloadMobileNet(): void {
  void getMobileNetClassifier().catch(() => undefined);
}
