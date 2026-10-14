/**
 * Personal-data backup.
 *
 * Produces a portable archive of everything PAIDEIA stores on this device:
 * the structured library (books, summaries, notes, quotations, sessions and
 * mind maps), a spreadsheet-friendly CSV of the catalogue, a Markdown file per
 * book, the reader profile, and a computed insights snapshot — wrapped in a
 * single ZIP with a machine-readable manifest.
 *
 * Honesty rules honoured here:
 *  - The manifest lists every dataset with its record count.
 *  - Anything not included (or only included when present) is listed under
 *     `omitted`, and the local-only nature of the data is stated explicitly.
 */

import type { LibrarySnapshot } from "@/lib/services/library/persistence";
import type { ReaderProfile } from "@/lib/types/profile";
import { PROFILE_SCHEMA_VERSION } from "@/lib/types/profile";
import type { BookDetail } from "@/lib/types/library";
import type { Book } from "@/lib/types/book";
import {
  bookToMarkdown,
  slugifyFilename,
} from "@/lib/utils/export";
import { createZip, type ZipEntry } from "@/lib/utils/zip";
import { computeInsights } from "@/lib/services/insights";

export const BACKUP_FORMAT = "paideia.backup";
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupDataset {
  path: string;
  kind: "json" | "csv" | "markdown" | "text" | "binary";
  records: number;
}

export interface BackupManifest {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  app: string;
  createdAt: string;
  datasets: BackupDataset[];
  omitted: string[];
  limitations: string[];
}

export interface BackupInput {
  snapshot: LibrarySnapshot;
  profile: ReaderProfile;
  /** Optional avatar blob read from IndexedDB at export time. */
  avatar?: Blob | null;
}

export interface BackupResult {
  filename: string;
  manifest: BackupManifest;
  files: ZipEntry[];
  blob: Blob;
}

const APP = "Paideia — A Reader's Library";

/** RFC-4180-ish CSV escaping. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A flat, spreadsheet-friendly view of the library's books. */
export function booksToCsv(books: Book[]): string {
  const header = [
    "id",
    "title",
    "author",
    "category",
    "status",
    "progress",
    "rating",
    "page_count",
    "current_page",
    "language",
    "publisher",
    "published_year",
    "isbn",
    "tags",
    "started_at",
    "completed_at",
    "created_at",
    "updated_at",
  ];
  const rows = books.map((book) =>
    [
      book.id,
      book.title,
      book.author,
      book.category,
      book.status,
      book.progress,
      book.rating ?? "",
      book.pageCount ?? "",
      book.currentPage ?? "",
      book.language ?? "",
      book.publisher ?? "",
      book.publishedYear ?? "",
      book.isbn ?? "",
      book.tags.join("; "),
      book.startedAt ? book.startedAt.slice(0, 10) : "",
      book.completedAt ? book.completedAt.slice(0, 10) : "",
      book.createdAt,
      book.updatedAt,
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...rows].join("\r\n");
}

function detailFor(snapshot: LibrarySnapshot, book: Book): BookDetail {
  return {
    book,
    summary: snapshot.summaries[book.id] ?? null,
    notes: snapshot.notes.filter((note) => note.bookId === book.id),
    quotes: snapshot.quotes.filter((quote) => quote.bookId === book.id),
    sessions: snapshot.sessions.filter((session) => session.bookId === book.id),
  };
}

function uniqueBookPaths(snapshot: LibrarySnapshot): Array<[Book, string]> {
  const used = new Set<string>();
  return snapshot.books.map((book) => {
    const base = slugifyFilename(book.title || book.id);
    let path = `${base}.md`;
    let n = 2;
    while (used.has(path)) {
      path = `${base}-${n}.md`;
      n += 1;
    }
    used.add(path);
    return [book, path];
  });
}

function extensionFor(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/avif":
      return "avif";
    default:
      return "webp";
  }
}

/** Assemble the complete backup (files, manifest, zip) in memory. */
export async function buildBackup(input: BackupInput): Promise<BackupResult> {
  const { snapshot, profile } = input;
  const createdAt = new Date().toISOString();
  const stamp = createdAt.slice(0, 10);

  const files: ZipEntry[] = [];
  const datasets: BackupDataset[] = [];
  const omitted: string[] = [];

  /* ----- full structured library (lossless, includes mind maps) ----- */
  const libraryPayload = {
    format: "paideia.library",
    version: 3,
    exportedAt: createdAt,
    books: snapshot.books,
    summaries: snapshot.summaries,
    notes: snapshot.notes,
    quotes: snapshot.quotes,
    sessions: snapshot.sessions,
    mindMaps: snapshot.mindMaps,
    reviews: snapshot.reviews,
  };
  files.push({
    path: "library.json",
    content: JSON.stringify(libraryPayload, null, 2),
  });
  datasets.push({ path: "library.json", kind: "json", records: snapshot.books.length });

  /* ----- CSV of books ----- */
  files.push({ path: "library.csv", content: booksToCsv(snapshot.books) });
  datasets.push({
    path: "library.csv",
    kind: "csv",
    records: snapshot.books.length,
  });

  /* ----- profile ----- */
  files.push({
    path: "profile.json",
    content: JSON.stringify(
      {
        format: "paideia.profile",
        schemaVersion: PROFILE_SCHEMA_VERSION,
        exportedAt: createdAt,
        profile,
      },
      null,
      2,
    ),
  });
  datasets.push({ path: "profile.json", kind: "json", records: 1 });

  /* ----- avatar, if one exists on this device ----- */
  if (input.avatar) {
    const bytes = new Uint8Array(await input.avatar.arrayBuffer());
    const path = `assets/avatar.${extensionFor(input.avatar.type)}`;
    files.push({ path, content: bytes });
    datasets.push({ path, kind: "binary", records: 1 });
  } else {
    omitted.push("avatar (no portrait set on this device)");
  }

  /* ----- per-book Markdown ----- */
  const bookPaths = uniqueBookPaths(snapshot);
  for (const [book, path] of bookPaths) {
    files.push({
      path: `books/${path}`,
      content: bookToMarkdown(detailFor(snapshot, book)),
    });
  }
  if (bookPaths.length > 0) {
    datasets.push({
      path: "books/",
      kind: "markdown",
      records: bookPaths.length,
    });
  }

  /* ----- derived insights (real data only) ----- */
  const insights = computeInsights(snapshot, {
    annualGoal: profile.annualGoal,
  });
  files.push({
    path: "insights.json",
    content: JSON.stringify(
      { format: "paideia.insights", generatedAt: createdAt, insights },
      null,
      2,
    ),
  });
  datasets.push({ path: "insights.json", kind: "json", records: 1 });

  const manifest: BackupManifest = {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    app: APP,
    createdAt,
    datasets,
    omitted,
    limitations: [
      "This archive contains only data stored in this browser on this device.",
      "No cloud or cross-device copy exists: PAIDEIA is local-first and has no account system in this build.",
      "The profile portrait lives in IndexedDB and is included only when present at export time.",
    ],
  };

  files.push({
    path: "manifest.json",
    content: JSON.stringify(manifest, null, 2),
  });

  const blob = createZip(files, new Date(createdAt));

  return {
    filename: `paideia-backup-${stamp}.zip`,
    manifest,
    files,
    blob,
  };
}

/** Trigger a browser download for a backup result. */
export function downloadBackup(result: BackupResult): void {
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export { PROFILE_SCHEMA_VERSION };
