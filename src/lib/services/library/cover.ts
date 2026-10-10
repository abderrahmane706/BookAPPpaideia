import { validateCoverUpload } from "@/lib/supabase/storage";

export type CoverProcessResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: string };

const MAX_WIDTH = 720;
const MAX_HEIGHT = 1080;

/**
 * Validate and normalise a reader-uploaded cover entirely on the client.
 *
 * Validation (MIME + size + non-empty) is shared with the storage module so the
 * same rules apply whether the cover ends up in local storage or (once auth
 * lands) in the private `book-covers` bucket. The image is downscaled and
 * re-encoded so a stored data URL stays small and never bloats persistence.
 */
export async function processCoverFile(file: File): Promise<CoverProcessResult> {
  const validation = validateCoverUpload(file);
  if (!validation.ok) return { ok: false, reason: validation.reason };

  try {
    const bitmap = await decode(file);
    if (!bitmap) return { ok: false, reason: "That image could not be read." };

    const scale = Math.min(
      1,
      MAX_WIDTH / bitmap.width,
      MAX_HEIGHT / bitmap.height,
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, reason: "That image could not be processed." };
    ctx.drawImage(bitmap, 0, 0, width, height);
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

    // Prefer WebP; fall back to JPEG where it is unsupported.
    let dataUrl = canvas.toDataURL("image/webp", 0.82);
    if (!dataUrl.startsWith("data:image/webp")) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    }
    return { ok: true, dataUrl };
  } catch {
    return { ok: false, reason: "That image could not be read." };
  }
}

type DecodedImage = CanvasImageSource & { width: number; height: number; close?: () => void };

async function decode(file: File): Promise<DecodedImage | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> */
    }
  }
  return decodeViaImageElement(file);
}

function decodeViaImageElement(file: File): Promise<DecodedImage | null> {
  return new Promise((resolve) => {
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
