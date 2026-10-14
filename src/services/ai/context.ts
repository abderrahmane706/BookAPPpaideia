import type { LibrarySnapshot } from "@/lib/services/library";
import type { AssistantContext, BookContext, GroundingSource } from "./types";

/**
 * Client-side context builder.
 *
 * The reader's library lives in the browser (local-first), so the client — not
 * the server — assembles the bounded context the assistant may see. Only the
 * reader's own material is included, it is capped, and the server treats it as
 * untrusted data (see prompt.ts). Nothing here is ever persisted server-side.
 */

export type AssistantScope =
  | { kind: "library" }
  | { kind: "book"; bookId: string };

const REFLECTION_KEYS = [
  "keyTakeaway",
  "mostImportantIdea",
  "personalApplication",
  "personalReview",
] as const;

const REFLECTION_LABELS: Record<(typeof REFLECTION_KEYS)[number], string> = {
  keyTakeaway: "Key takeaway",
  mostImportantIdea: "Most important idea",
  personalApplication: "Personal application",
  personalReview: "Personal review",
};

const MAX_SOURCES = 32;

export function scopeLabel(scope: AssistantScope, snapshot: LibrarySnapshot): string {
  if (scope.kind === "book") {
    return snapshot.books.find((book) => book.id === scope.bookId)?.title ?? "This book";
  }
  return "Your whole library";
}

export function buildAssistantContext(
  snapshot: LibrarySnapshot,
  scope: AssistantScope,
): AssistantContext {
  const bookIds =
    scope.kind === "book"
      ? [scope.bookId]
      : snapshot.books.map((book) => book.id);

  const books: BookContext[] = [];
  const sources: GroundingSource[] = [];

  for (const bookId of bookIds) {
    const book = snapshot.books.find((candidate) => candidate.id === bookId);
    if (!book) continue;

    const summary = snapshot.summaries[bookId];
    const notes = snapshot.notes.filter((note) => note.bookId === bookId);
    const quotes = snapshot.quotes.filter((quote) => quote.bookId === bookId);

    const reflections: Record<string, string> = {};
    for (const key of REFLECTION_KEYS) {
      const value = book[key];
      if (typeof value === "string" && value.trim().length > 0) {
        reflections[REFLECTION_LABELS[key]] = value.trim();
      }
    }

    books.push({
      bookId,
      title: book.title,
      author: book.author,
      status: book.status,
      summary: summary?.plainText?.trim() || undefined,
      notes: notes.map((note) => ({ title: note.title, body: note.body })),
      quotes: quotes.map((quote) => ({ text: quote.text, page: quote.page })),
      reflections: Object.keys(reflections).length > 0 ? reflections : undefined,
    });

    if (summary?.plainText?.trim()) {
      sources.push({
        id: `summary:${bookId}`,
        label: `Summary — ${book.title}`,
        bookId,
        section: "summary",
        kind: "summary",
      });
    }
    for (const note of notes) {
      sources.push({
        id: `note:${note.id}`,
        label: `Note${note.title ? ` “${note.title}”` : ""} — ${book.title}`,
        bookId,
        section: "notes",
        kind: "note",
      });
    }
    for (const quote of quotes) {
      sources.push({
        id: `quote:${quote.id}`,
        label: `Quotation${quote.page !== null ? ` (p. ${quote.page})` : ""} — ${book.title}`,
        bookId,
        section: "quotes",
        kind: "quote",
      });
    }
    for (const [label] of Object.entries(reflections)) {
      sources.push({
        id: `reflection:${bookId}:${label}`,
        label: `${label} — ${book.title}`,
        bookId,
        section: "review",
        kind: "reflection",
      });
    }
  }

  return {
    scope: scope.kind,
    bookId: scope.kind === "book" ? scope.bookId : undefined,
    books,
    sources: sources.slice(0, MAX_SOURCES),
  };
}
