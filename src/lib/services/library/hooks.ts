import { useMemo, useSyncExternalStore } from "react";
import type { Book } from "@/lib/types/book";
import type { BookDetail } from "@/lib/types/library";
import type { ReviewItem } from "@/lib/types/review";
import { compareDue, isDue } from "@/lib/services/review/scheduler";
import { library } from "./store";

/**
 * Reactive hooks over the library store.
 *
 * `useSyncExternalStore` gives us a tear-free, SSR-safe subscription: the
 * server snapshot is an empty library, and the client snapshot re-reads the
 * device store, so hydration never mismatches.
 */

export function useLibrarySnapshot() {
  return useSyncExternalStore(
    library.subscribe,
    library.getSnapshot,
    library.getServerSnapshot,
  );
}

/** True once the client has hydrated from persistence. */
export function useLibraryReady(): boolean {
  return useSyncExternalStore(library.subscribe, library.isReady, () => false);
}

/** All books, most-recently-added first. */
export function useBooks(): Book[] {
  const snapshot = useLibrarySnapshot();
  return useMemo(
    () =>
      [...snapshot.books].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [snapshot.books],
  );
}

export function useBook(id: string | null | undefined): Book | null {
  const snapshot = useLibrarySnapshot();
  return useMemo(
    () => (id ? snapshot.books.find((b) => b.id === id) ?? null : null),
    [snapshot.books, id],
  );
}

export function useBookDetail(id: string | null | undefined): BookDetail | null {
  const snapshot = useLibrarySnapshot();
  return useMemo(() => {
    if (!id) return null;
    const book = snapshot.books.find((b) => b.id === id);
    if (!book) return null;
    return {
      book,
      summary: snapshot.summaries[id] ?? null,
      notes: snapshot.notes.filter((n) => n.bookId === id),
      quotes: snapshot.quotes.filter((q) => q.bookId === id),
      sessions: snapshot.sessions
        .filter((s) => s.bookId === id)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    };
  }, [snapshot, id]);
}

/** All review items for one book, oldest queued first. */
export function useBookReviews(bookId: string | null | undefined): ReviewItem[] {
  const snapshot = useLibrarySnapshot();
  return useMemo(() => {
    if (!bookId) return [];
    return snapshot.reviews
      .filter((r) => r.bookId === bookId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [snapshot.reviews, bookId]);
}

/**
 * Today's due queue, in stable order. `nowMs` is optional so an island can pin
 * the "now" used for the whole render pass (avoiding mid-render flicker).
 */
export function useDueReviews(now: Date = new Date()): ReviewItem[] {
  const snapshot = useLibrarySnapshot();
  const stamp = now.getTime();
  return useMemo(
    () => snapshot.reviews.filter((r) => isDue(r, new Date(stamp))).sort(compareDue),
    [snapshot.reviews, stamp],
  );
}

/** Every review item, oldest queued first (for the saved-items list). */
export function useReviews(): ReviewItem[] {
  const snapshot = useLibrarySnapshot();
  return useMemo(
    () =>
      [...snapshot.reviews].sort((a, b) =>
        a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
      ),
    [snapshot.reviews],
  );
}
