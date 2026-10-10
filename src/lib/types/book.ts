/**
 * Domain types for PAIDEIA.
 * These are the application-level (canonical) types. Persistence concerns are
 * handled by the service layer (see lib/services/library), so the UI never
 * depends on the raw Supabase row shape.
 */

/** Reading states supported in the current product. */
export type ReadingStatus =
  | "want_to_read"
  | "reading"
  | "paused"
  | "completed";

/**
 * Reading progress is represented initially as milestone percentages.
 * A value of 100 marks the book as completed. Designed to later extend to
 * exact page-based progress without changing the model (see BookProgress).
 */
export type ReadingProgress = 0 | 25 | 50 | 75 | 100;

/** Personal rating as a number of stars, 1 to 5. */
export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface Book {
  id: string;
  title: string;
  author: string;
  /** Free-text genre/category. */
  category: string;
  /**
   * Cover image. In the local-first (no-auth) build this is a downscaled
   * data URL. When Supabase is configured it holds the public URL of the
   * object stored in the `book-covers` bucket (never the application artwork).
   */
  coverUrl: string | null;
  rating: StarRating | null;
  status: ReadingStatus;
  progress: ReadingProgress;

  // --- Optional bibliographic metadata (all nullable) ---
  description: string | null;
  isbn: string | null;
  pageCount: number | null;
  language: string | null;
  publisher: string | null;
  publishedYear: number | null;
  /** Provenance of the record (e.g. "manual"). Never a secret. */
  source: string | null;

  // --- Reading timeline (supplementary to milestone progress) ---
  /** Exact current page when the reader tracks it. Milestones remain canonical. */
  currentPage: number | null;
  startedAt: string | null;
  completedAt: string | null;

  // --- Personal evaluation / reflection ---
  personalReview: string | null;
  keyTakeaway: string | null;
  mostImportantIdea: string | null;
  personalApplication: string | null;
  tags: string[];

  createdAt: string;
  updatedAt: string;
}

/** Fields accepted when creating a book (title + author are the only required). */
export interface BookCreateInput {
  title: string;
  author: string;
  category?: string;
  coverUrl?: string | null;
  rating?: StarRating | null;
  status?: ReadingStatus;
  progress?: ReadingProgress;
  description?: string | null;
  isbn?: string | null;
  pageCount?: number | null;
  language?: string | null;
  publisher?: string | null;
  publishedYear?: number | null;
  currentPage?: number | null;
  tags?: string[];
  source?: string | null;
}

/** Partial update payload for an existing book. */
export type BookUpdateInput = Partial<Omit<Book, "id" | "createdAt" | "updatedAt">>;

/**
 * Future, page-precise progress. Not yet a table, but the milestone model is
 * designed to expand into this without breaking consumers.
 */
export interface BookProgress {
  bookId: string;
  /** Current milestone from 0-100 (kept for compatibility). */
  milestone: ReadingProgress;
  /** Optional exact progress, for later phases. */
  currentPage?: number;
  totalPages?: number;
}

/** Collections used by the dashboard to partition the library. */
export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  want_to_read: "Want to Read",
  reading: "Currently Reading",
  paused: "Paused",
  completed: "Completed",
};

/** All reading statuses, in display order. */
export const READING_STATUSES: ReadingStatus[] = [
  "want_to_read",
  "reading",
  "paused",
  "completed",
];

/** All valid reading milestones, in order. */
export const READING_MILESTONES: ReadingProgress[] = [0, 25, 50, 75, 100];

/** Helper to derive status from a progress milestone. */
export function statusFromProgress(progress: ReadingProgress): ReadingStatus {
  return progress >= 100 ? "completed" : "reading";
}

/**
 * Snap an arbitrary 0–100 percentage to the nearest milestone.
 * Keeps page-based input compatible with the canonical milestone model.
 */
export function milestoneFromPercent(percent: number): ReadingProgress {
  const clamped = Math.min(100, Math.max(0, percent));
  const stepped = Math.round(clamped / 25) * 25;
  return Math.min(100, Math.max(0, stepped)) as ReadingProgress;
}

/** Derive a milestone from an exact page position, when both are known. */
export function milestoneFromPage(
  currentPage: number,
  pageCount: number | null,
): ReadingProgress | null {
  if (!pageCount || pageCount <= 0) return null;
  return milestoneFromPercent((currentPage / pageCount) * 100);
}
