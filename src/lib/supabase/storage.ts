/**
 * Supabase Storage architecture for book covers.
 *
 * Design decisions:
 *  - A single `book-covers` bucket, private by default.
 *  - Object paths are server-generated and namespaced so they never trust a
 *    client-supplied filename, and can later be scoped per user:
 *      {ownerId}/{bookId}/{suffix}.{ext}
 *  - Serve via Supabase's signed/transform URL rather than exposing the raw
 *    path as public.
 */

export const BOOK_COVERS_BUCKET = "book-covers";

const ALLOWED_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "avif"] as const;
export type CoverExtension = (typeof ALLOWED_IMAGE_EXTENSIONS)[number];
export const SUPPORTED_COVER_EXTENSIONS: ReadonlyArray<CoverExtension> =
  ALLOWED_IMAGE_EXTENSIONS;

const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5 MB

/** Extract the file extension from a MIME type (never from the filename). */
export function extensionFromMime(mimeType: string): CoverExtension | null {
  const map: Record<string, CoverExtension> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  return map[mimeType] ?? null;
}

/** Validate an upload payload (size + allowed image MIME). */
export function validateCoverUpload(
  file: { size: number; type: string },
): { ok: true; extension: CoverExtension } | { ok: false; reason: string } {
  if (file.size === 0) {
    return { ok: false, reason: "The uploaded file is empty." };
  }
  if (file.size > MAX_COVER_BYTES) {
    return { ok: false, reason: "Cover images must be 5 MB or smaller." };
  }
  const extension = extensionFromMime(file.type);
  if (!extension) {
    return {
      ok: false,
      reason: "Cover must be a PNG, JPEG, WebP or AVIF image.",
    };
  }
  return { ok: true, extension };
}

/**
 * Build a namespaced, server-generated storage path.
 * `suffix` should be a short random token (e.g. a UUID) — never user input.
 */
export function buildCoverPath(
  ownerId: string,
  bookId: string,
  suffix: string,
  extension: CoverExtension,
): string {
  return `${ownerId}/${bookId}/${suffix}.${extension}`;
}

/** Public bucket name constant for reference. */
export const COVER_FOLDER = "covers";
