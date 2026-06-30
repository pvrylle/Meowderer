/**
 * @imgly/background-removal sets `ort.env.wasm.numThreads` from
 * `navigator.hardwareConcurrency`. Without COOP/COEP that triggers console
 * noise and can break WASM init — force single-thread before any imgly load.
 */
let concurrencyPatched = false;

function patchHardwareConcurrency(): void {
  if (concurrencyPatched || typeof navigator === "undefined") return;
  Object.defineProperty(Navigator.prototype, "hardwareConcurrency", {
    get: () => 1,
    configurable: true,
  });
  concurrencyPatched = true;
}

/** Call before importing @imgly/background-removal (preload or removeBackground). */
export async function ensureWasmSingleThread(): Promise<void> {
  patchHardwareConcurrency();
}

export async function runWithSingleThreadWasm<T>(
  fn: () => Promise<T>,
): Promise<T> {
  await ensureWasmSingleThread();
  return fn();
}

/** @deprecated Use ensureWasmSingleThread */
export const ensureSingleThreadWasm = ensureWasmSingleThread;
