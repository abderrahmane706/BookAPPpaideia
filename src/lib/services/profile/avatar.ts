/**
 * Avatar asset handling.
 *
 * Avatar binaries live in IndexedDB (never as base64 in localStorage): a small
 * blob store keeps the profile text record tiny and avoids the well-known
 * localStorage quota problems. Everything here degrades gracefully when
 * IndexedDB is unavailable (private browsing, hardened browsers) — callers get
 * `null`/no-op rather than a crash.
 */

const DB_NAME = "paideia-assets";
const DB_VERSION = 1;
const STORE_NAME = "assets";
const AVATAR_KEY = "avatar";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const AVATAR_MAX_EDGE = 512;

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
]);

export type AvatarProcessResult =
  | { ok: true; blob: Blob }
  | { ok: false; reason: string };

/** Validate a candidate avatar (type + size), independent of its filename. */
export function validateAvatarFile(file: {
  size: number;
  type: string;
}): { ok: true } | { ok: false; reason: string } {
  if (file.size === 0) return { ok: false, reason: "That file is empty." };
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, reason: "Choose an image 2 MB or smaller." };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, reason: "Use a PNG, JPEG, WebP or AVIF image." };
  }
  return { ok: true };
}

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return openDatabase().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const tx = db.transaction(STORE_NAME, mode);
          const store = tx.objectStore(STORE_NAME);
          const request = fn(store);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
          tx.oncomplete = () => db.close();
          tx.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch {
          db.close();
          resolve(null);
        }
      }),
  );
}

/** True when an IndexedDB-backed avatar can be persisted. */
export async function avatarStorageAvailable(): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  db.close();
  return true;
}

export async function getAvatarBlob(): Promise<Blob | null> {
  const result = await withStore<Blob>("readonly", (store) =>
    store.get(AVATAR_KEY) as IDBRequest<Blob>,
  );
  return result instanceof Blob ? result : null;
}

export async function saveAvatarBlob(blob: Blob): Promise<boolean> {
  const result = await withStore<IDBValidKey>("readwrite", (store) =>
    store.put(blob, AVATAR_KEY),
  );
  // A successful put resolves with the key; null signals failure/unavailability.
  return result !== null || (await getAvatarBlob()) !== null;
}

export async function deleteAvatarBlob(): Promise<void> {
  await withStore<undefined>("readwrite", (store) =>
    store.delete(AVATAR_KEY) as IDBRequest<undefined>,
  );
}

type DecodedImage = CanvasImageSource & {
  width: number;
  height: number;
  close?: () => void;
};

async function decode(file: File): Promise<DecodedImage | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through */
    }
  }
  return new Promise((resolve) => {
    if (typeof Image === "undefined") {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Validate, square-crop and downscale an avatar entirely on the client, then
 * return a compact blob ready for IndexedDB. The file's name is never trusted;
 * only its MIME type and byte length are considered.
 */
export async function processAvatarFile(file: File): Promise<AvatarProcessResult> {
  const validation = validateAvatarFile(file);
  if (!validation.ok) return validation;

  const bitmap = await decode(file);
  if (!bitmap) return { ok: false, reason: "That image could not be read." };

  try {
    const edge = Math.min(bitmap.width, bitmap.height);
    const sx = Math.round((bitmap.width - edge) / 2);
    const sy = Math.round((bitmap.height - edge) / 2);
    const size = Math.min(AVATAR_MAX_EDGE, edge);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, reason: "That image could not be processed." };
    ctx.drawImage(bitmap, sx, sy, edge, edge, 0, 0, size, size);
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (value) => resolve(value),
        "image/webp",
        0.85,
      );
    });
    if (!blob) return { ok: false, reason: "That image could not be processed." };
    return { ok: true, blob };
  } catch {
    return { ok: false, reason: "That image could not be read." };
  }
}
