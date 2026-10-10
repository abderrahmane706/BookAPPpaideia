/**
 * Personal-knowledge domain types: summaries, notes, quotations and reading
 * sessions. These all hang off a Book and are the reader's own material — never
 * generated, never scraped from a copyrighted source.
 */

/**
 * A minimal, editor-agnostic rich-text document.
 * Structurally compatible with Tiptap/ProseMirror `JSONContent`, so we store a
 * structured representation (not rendered HTML) and never need to
 * `dangerouslySetInnerHTML` untrusted markup.
 */
export interface RichTextNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

export interface RichTextDoc extends RichTextNode {
  type: "doc";
}

/** A reader's personal summary for one book (one per book). */
export interface Summary {
  bookId: string;
  /** Structured editor document (may be an empty doc). */
  content: RichTextDoc | null;
  /** Plain-text projection, kept in sync for search & export. */
  plainText: string;
  createdAt: string;
  updatedAt: string;
}

/** A single free-form note attached to a book. */
export interface Note {
  id: string;
  bookId: string;
  title: string | null;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** Restrained, theme-safe highlight tones (no user-supplied colours). */
export const QUOTE_HIGHLIGHT_TONES = ["gold", "blue", "green", "rose"] as const;
export type QuoteHighlight = (typeof QUOTE_HIGHLIGHT_TONES)[number];

/** A quotation / highlight the reader chose to record. */
export interface Quote {
  id: string;
  bookId: string;
  text: string;
  /** Optional page number — never required. */
  page: number | null;
  highlight: QuoteHighlight;
  /** Optional personal annotation on the quotation. */
  annotation: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A recorded reading session. */
export interface ReadingSession {
  id: string;
  bookId: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  minutes: number;
  /** Optional pages read. */
  pages: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Aggregate returned to the workspace for a single book. */
export interface BookDetail {
  book: import("./book").Book;
  summary: Summary | null;
  notes: Note[];
  quotes: Quote[];
  sessions: ReadingSession[];
}

/** Totals derived from a book's recorded sessions. */
export interface ReadingTotals {
  totalMinutes: number;
  sessionCount: number;
  totalPages: number;
  lastReadAt: string | null;
}
