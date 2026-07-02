let configured = false;

/** Shared Transformers.js env for browser pipelines (CLIP, etc.). */
export async function configureTransformersEnv(): Promise<void> {
  if (configured) return;

  const { env } = await import("@huggingface/transformers");

  env.allowLocalModels = true;
  env.useBrowserCache = true;

  if (typeof window !== "undefined") {
    env.localModelPath = `${window.location.origin}/models/`;
    env.remoteHost = `${window.location.origin}/api/ml/hf/`;
  }

  const originalFetch = env.fetch.bind(env);
  env.fetch = (url, options) => {
    const headers = new Headers(options?.headers);
    const token =
      typeof process !== "undefined"
        ? process.env?.HF_TOKEN ?? process.env?.HF_ACCESS_TOKEN
        : undefined;

    if (
      token &&
      typeof url === "string" &&
      (url.includes("huggingface.co") || url.includes("hf.co"))
    ) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return originalFetch(url, { ...options, headers });
  };

  configured = true;
}
