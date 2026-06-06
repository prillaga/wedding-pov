const DB_NAME = "wedding-pov-upload-media";
const STORE_NAME = "media";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Failed to open media store"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const request = run(tx.objectStore(STORE_NAME));

        request.onerror = () => {
          db.close();
          reject(request.error ?? new Error("Media store request failed"));
        };

        tx.oncomplete = () => {
          db.close();
          resolve(request.result as T);
        };

        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("Media store transaction failed"));
        };

        tx.onabort = () => {
          db.close();
          reject(tx.error ?? new Error("Media store transaction aborted"));
        };
      })
  );
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

export async function saveUploadMedia(id: string, imageData: string): Promise<boolean> {
  try {
    const blob = await dataUrlToBlob(imageData);
    await runTransaction("readwrite", (store) => store.put(blob, id));
    return true;
  } catch (err) {
    console.error("[WeddingPOV] saveUploadMedia failed:", err);
    return false;
  }
}

export async function getUploadMedia(id: string): Promise<string | null> {
  try {
    const value = await runTransaction<Blob | string | undefined>("readonly", (store) => store.get(id));
    if (typeof value === "string") return value;
    if (value instanceof Blob) return blobToDataUrl(value);
    return null;
  } catch (err) {
    console.error("[WeddingPOV] getUploadMedia failed:", err);
    return null;
  }
}

export async function deleteUploadMedia(id: string): Promise<void> {
  try {
    await runTransaction("readwrite", (store) => store.delete(id));
  } catch (err) {
    console.error("[WeddingPOV] deleteUploadMedia failed:", err);
  }
}

export async function deleteUploadMediaBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      ids.forEach((id) => store.delete(id));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error("Media batch delete failed"));
      };
    });
  } catch (err) {
    console.error("[WeddingPOV] deleteUploadMediaBatch failed:", err);
  }
}

export async function clearAllUploadMedia(): Promise<void> {
  try {
    await runTransaction("readwrite", (store) => store.clear());
  } catch (err) {
    console.error("[WeddingPOV] clearAllUploadMedia failed:", err);
  }
}
