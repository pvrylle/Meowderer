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

export async function getMobileNetClassifier(): Promise<MobileNetClassifier> {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const [mobilenet, tf] = await Promise.all([
        import("@tensorflow-models/mobilenet"),
        import("@tensorflow/tfjs"),
      ]);

      await tf.setBackend("webgl");
      await tf.ready();

      const model = await mobilenet.load({ version: 1, alpha: 1.0 });

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
