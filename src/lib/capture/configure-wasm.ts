/**
 * @imgly/background-removal sets `ort.env.wasm.numThreads` from
 * `navigator.hardwareConcurrency`. Without COOP/COEP that triggers a console
 * warning and a single-thread fallback — patch thread count for the ML call only.
 */
export async function runWithSingleThreadWasm<T>(
  fn: () => Promise<T>,
): Promise<T> {
  const desc = Object.getOwnPropertyDescriptor(
    Navigator.prototype,
    "hardwareConcurrency",
  );
  Object.defineProperty(Navigator.prototype, "hardwareConcurrency", {
    get: () => 1,
    configurable: true,
  });

  try {
    return await fn();
  } finally {
    if (desc) {
      Object.defineProperty(Navigator.prototype, "hardwareConcurrency", desc);
    }
  }
}

export async function ensureSingleThreadWasm(): Promise<void> {
  // Reserved for future ort/transformers env tweaks; imgly reads hardwareConcurrency.
}
