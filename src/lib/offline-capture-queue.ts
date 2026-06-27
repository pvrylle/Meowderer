const DB_NAME = "catdex-offline";
const STORE_NAME = "pending-captures";
const DB_VERSION = 1;

export type PendingCapture = {
  id: string;
  photoBlob: Blob;
  stickerBlob: Blob;
  nickname: string | null;
  lat: number | null;
  lng: number | null;
  coat_type: string | null;
  rarity: string | null;
  createdAt: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function enqueueCapture(
  capture: Omit<PendingCapture, "id" | "createdAt">,
): Promise<string> {
  const db = await openDb();
  const id = crypto.randomUUID();
  const entry: PendingCapture = {
    ...capture,
    id,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function listPendingCaptures(): Promise<PendingCapture[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function removePendingCapture(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function pendingCaptureCount(): Promise<number> {
  const items = await listPendingCaptures();
  return items.length;
}
