import type { Book } from "@/lib/types/book";

export interface DashboardStats {
  totalBooks: number;
  currentlyReading: number;
  completed: number;
  paused: number;
  wantToRead: number;
  /** Percentage of the library finished, 0–100. */
  completionRate: number;
  /** Average rating across rated books, or null. */
  averageRating: number | null;
}

/** Derive dashboard statistics from a book list. */
export function computeDashboardStats(books: Book[]): DashboardStats {
  const total = books.length;
  const currentlyReading = books.filter((b) => b.status === "reading").length;
  const completed = books.filter((b) => b.status === "completed").length;
  const paused = books.filter((b) => b.status === "paused").length;
  const wantToRead = books.filter((b) => b.status === "want_to_read").length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const rated = books.filter((b) => b.rating !== null);
  const averageRating =
    rated.length > 0
      ? Math.round(
          (rated.reduce((sum, b) => sum + (b.rating ?? 0), 0) / rated.length) *
            10,
        ) / 10
      : null;

  return {
    totalBooks: total,
    currentlyReading,
    completed,
    paused,
    wantToRead,
    completionRate,
    averageRating,
  };
}

/** Partition books into "currently reading" and "completed". */
export function partitionLibrary(books: Book[]) {
  return {
    reading: books.filter((b) => b.status === "reading"),
    completed: books.filter((b) => b.status === "completed"),
    paused: books.filter((b) => b.status === "paused"),
    wantToRead: books.filter((b) => b.status === "want_to_read"),
  };
}

/**
 * The single "continue reading" focus: the most-advanced in-progress book.
 * Returns null when nothing is actively being read.
 */
export function pickNextToRead(books: Book[]): Book | null {
  const candidates = books
    .filter((b) => b.status === "reading" || b.status === "paused")
    .sort((a, b) => b.progress - a.progress);
  return candidates[0] ?? null;
}
