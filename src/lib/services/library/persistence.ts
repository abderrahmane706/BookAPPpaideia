import type { Book } from "@/lib/types/book";
import type { MindMap } from "@/lib/types/mindmap";
import type { Note, Quote, ReadingSession, Summary } from "@/lib/types/library";
import type { ReviewItem } from "@/lib/types/review";

/**
 * Local-first persistence for the no-login build.
 *
 * ---------------------------------------------------------------------------
 * PERSISTENCE STRATEGY (read this before changing anything)
 * ---------------------------------------------------------------------------
 * The product ships with authentication deferred. The database schema
 * (`supabase/migrations/0001_init.sql`) models every resource as owned by
 * `auth.users` with `auth.uid()` Row Level Security. With no session there is
 * no way to read/write those rows *without* either weakening RLS or shipping a
 * service-role key to the browser — both explicitly out of bounds.
 *
 * So until auth lands, the app persists to the device under a single,
 * versioned localStorage key, behind the repository boundary in `store.ts`.
 * Nothing else in the app knows where data lives: swapping this module for a
 * Supabase-backed implementation (see `supabase/migrations/0002_library.sql`)
 * is the entire migration.
 *
 * This is a LOCAL store, not cloud sync. It is never presented as such.
 * ---------------------------------------------------------------------------
 */

export const LIBRARY_STORAGE_KEY = "paideia.library.v1";

export interface LibrarySnapshot {
  books: Book[];
  /** Summaries keyed by bookId (at most one per book). */
  summaries: Record<string, Summary>;
  notes: Note[];
  quotes: Quote[];
  sessions: ReadingSession[];
  /** Mind maps, flat list. A book may own many; a map belongs to one book. */
  mindMaps: MindMap[];
  /** Agora review queue — reader-material pointers + scheduling state. */
  reviews: ReviewItem[];
}

export const EMPTY_SNAPSHOT: LibrarySnapshot = {
  books: [],
  summaries: {},
  notes: [],
  quotes: [],
  sessions: [],
  mindMaps: [],
  reviews: [],
};

/** True when running in a browser with a usable localStorage. */
export function storageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = "__paideia_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Defensive normalisation so a partially-written or older snapshot can never
 * crash the app — missing collections default to empty.
 */
export function normaliseSnapshot(raw: unknown): LibrarySnapshot | null {
  if (!isRecord(raw)) return null;
  const books = Array.isArray(raw.books)
    ? (raw.books as Book[]).map((book) => ({
        ...book,
        category:
          typeof book.category === "string" && book.category.trim()
            ? book.category
            : "Uncategorised",
        tags: Array.isArray(book.tags) ? book.tags : [],
      }))
    : [];
  const notes = Array.isArray(raw.notes)
    ? (raw.notes as Note[]).map((note) => ({
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : [],
      }))
    : [];
  const quotes = Array.isArray(raw.quotes) ? (raw.quotes as Quote[]) : [];
  const sessions = Array.isArray(raw.sessions)
    ? (raw.sessions as ReadingSession[])
    : [];
  const summaries = isRecord(raw.summaries)
    ? (raw.summaries as Record<string, Summary>)
    : {};
  const mindMaps = Array.isArray(raw.mindMaps) ? (raw.mindMaps as MindMap[]) : [];
  const reviews = Array.isArray(raw.reviews) ? (raw.reviews as ReviewItem[]) : [];
  return { books, summaries, notes, quotes, sessions, mindMaps, reviews };
}

export function loadSnapshot(): LibrarySnapshot | null {
  if (!storageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) return null;
    return normaliseSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot: LibrarySnapshot): boolean {
  if (!storageAvailable()) return false;
  try {
    window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    // Most likely a quota error (e.g. many large cover data URLs). Fail
    // silently at the storage layer; the UI keeps its in-memory state.
    return false;
  }
}
