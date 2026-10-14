import type { Book } from "@/lib/types/book";
import type { Note, Quote, Summary } from "@/lib/types/library";
import type { MindMap } from "@/lib/types/mindmap";
import type { LibrarySnapshot } from "@/lib/services/library/persistence";
import {
  SEARCH_GROUP_IDS,
  SEARCH_GROUP_LABELS,
  type SearchGroupId,
  type SearchResponse,
  type SearchResult,
} from "@/lib/types/search";

/**
 * Global search over the reader's local library.
 *
 * Deliberately a pure function of the in-memory snapshot: it performs no I/O,
 * no fetching and no full-database round-trips. The whole snapshot already
 * lives on the device, so scanning it is both correct and cheap; the UI still
 * debounces input so we do not rescan on every keystroke.
 */

export interface SearchOptions {
  /** Max results kept per group (matches are still counted in full). */
  maxPerGroup?: number;
  /** Restrict the search to a subset of collections. */
  groups?: SearchGroupId[];
}

const DEFAULT_MAX_PER_GROUP = 6;

/** A single searchable field of a record. */
interface Field {
  value: string | null | undefined;
  /** Relative importance: higher wins ties and boosts the score. */
  weight: number;
}

function fold(value: string): string {
  return value.toLocaleLowerCase();
}

/** Score one field for a folded query, returning the matched index or -1. */
function matchField(value: string, folded: string, weight: number): number {
  const haystack = fold(value);
  const index = haystack.indexOf(folded);
  if (index === -1) return -1;
  // Earlier matches and shorter fields score higher; the field weight dominates.
  const brevity = 1 / (1 + haystack.length / 120);
  const position = 1 - Math.min(index, 120) / 240;
  return weight * (1 + brevity + position);
}

/** Best score across a record's fields, plus the field that matched. */
function bestMatch(
  fields: Field[],
  folded: string,
): { score: number; source: string } | null {
  let best: { score: number; source: string } | null = null;
  for (const field of fields) {
    if (!field.value) continue;
    const score = matchField(field.value, folded, field.weight);
    if (score >= 0 && (!best || score > best.score)) {
      best = { score, source: field.value };
    }
  }
  return best;
}

/** Extract a short context window around the first match. */
export function buildSnippet(text: string, folded: string, radius = 64): string {
  const index = fold(text).indexOf(folded);
  if (index === -1) return text.slice(0, radius * 2).trim();
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + folded.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function bookHref(bookId: string, section?: string): string {
  return section ? `/library/${bookId}#${section}` : `/library/${bookId}`;
}

function scoreBooks(books: Book[], folded: string): SearchResult[] {
  const results: SearchResult[] = [];
  for (const book of books) {
    const match = bestMatch(
      [
        { value: book.title, weight: 6 },
        { value: book.author, weight: 3 },
        { value: book.tags.join(" "), weight: 2.5 },
        { value: book.category, weight: 2 },
        { value: book.description, weight: 1 },
        { value: book.isbn, weight: 1.5 },
        { value: book.publisher, weight: 1 },
        { value: book.personalReview, weight: 1 },
        { value: book.keyTakeaway, weight: 1 },
        { value: book.mostImportantIdea, weight: 1 },
        { value: book.personalApplication, weight: 1 },
      ],
      folded,
    );
    if (!match) continue;
    results.push({
      id: book.id,
      group: "books",
      title: book.title,
      subtitle: book.author || null,
      snippet: buildSnippet(match.source, folded),
      href: bookHref(book.id),
      score: match.score,
      updatedAt: book.updatedAt,
    });
  }
  return sortResults(results);
}

function scoreSummaries(
  summaries: Record<string, Summary>,
  bookMap: Map<string, Book>,
  folded: string,
): SearchResult[] {
  const results: SearchResult[] = [];
  for (const summary of Object.values(summaries)) {
    if (!summary.plainText) continue;
    const match = bestMatch([{ value: summary.plainText, weight: 1.5 }], folded);
    if (!match) continue;
    const book = bookMap.get(summary.bookId);
    results.push({
      id: summary.bookId,
      group: "summaries",
      title: book ? theSummaryTitle(book) : "Summary",
      subtitle: book?.title ?? null,
      snippet: buildSnippet(match.source, folded),
      href: bookHref(summary.bookId, "summary"),
      score: match.score,
      updatedAt: summary.updatedAt,
    });
  }
  return sortResults(results);
}

function theSummaryTitle(book: Book): string {
  return `Summary of “${book.title}”`;
}

function scoreNotes(
  notes: Note[],
  bookMap: Map<string, Book>,
  folded: string,
): SearchResult[] {
  const results: SearchResult[] = [];
  for (const note of notes) {
    const match = bestMatch(
      [
        { value: note.title, weight: 4 },
        { value: note.tags.join(" "), weight: 2 },
        { value: note.body, weight: 1.5 },
      ],
      folded,
    );
    if (!match) continue;
    const book = bookMap.get(note.bookId);
    results.push({
      id: note.id,
      group: "notes",
      title: note.title?.trim() || firstLine(note.body) || "Note",
      subtitle: book?.title ?? null,
      snippet: buildSnippet(note.body || note.title || "", folded),
      href: bookHref(note.bookId, "notes"),
      score: match.score,
      updatedAt: note.updatedAt,
    });
  }
  return sortResults(results);
}

function scoreQuotes(
  quotes: Quote[],
  bookMap: Map<string, Book>,
  folded: string,
): SearchResult[] {
  const results: SearchResult[] = [];
  for (const quote of quotes) {
    const match = bestMatch(
      [
        { value: quote.text, weight: 2.5 },
        { value: quote.annotation, weight: 1.5 },
      ],
      folded,
    );
    if (!match) continue;
    const book = bookMap.get(quote.bookId);
    results.push({
      id: quote.id,
      group: "quotes",
      title: quote.text.trim() || "Quotation",
      subtitle: book?.title ?? null,
      snippet: buildSnippet(quote.text, folded),
      href: bookHref(quote.bookId, "quotes"),
      score: match.score,
      updatedAt: quote.updatedAt,
    });
  }
  return sortResults(results);
}

function scoreMindMaps(
  mindMaps: MindMap[],
  bookMap: Map<string, Book>,
  folded: string,
): SearchResult[] {
  const results: SearchResult[] = [];
  for (const map of mindMaps) {
    const nodeBlob = map.nodes
      .map((node) => `${node.data.title} ${node.data.body}`)
      .join("\n");
    const match = bestMatch(
      [
        { value: map.title, weight: 5 },
        { value: nodeBlob, weight: 1.5 },
      ],
      folded,
    );
    if (!match) continue;
    const book = bookMap.get(map.bookId);
    results.push({
      id: map.id,
      group: "mindmaps",
      title: map.title,
      subtitle: book?.title ?? null,
      snippet: buildSnippet(match.source, folded),
      href: `/library/${map.bookId}/mind-map?map=${encodeURIComponent(map.id)}`,
      score: match.score,
      updatedAt: map.updatedAt,
    });
  }
  return sortResults(results);
}

function sortResults(results: SearchResult[]): SearchResult[] {
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function firstLine(text: string): string {
  const line = text.trim().split(/\r?\n/, 1)[0] ?? "";
  return line.length > 80 ? `${line.slice(0, 77)}…` : line;
}

/**
 * Run a global search. Returns one group per requested collection, always in a
 * stable order, including empty groups so the UI can render consistently.
 */
export function searchLibrary(
  snapshot: LibrarySnapshot,
  rawQuery: string,
  options: SearchOptions = {},
): SearchResponse {
  const query = rawQuery.trim();
  const max = options.maxPerGroup ?? DEFAULT_MAX_PER_GROUP;
  const requested = options.groups ?? SEARCH_GROUP_IDS;

  if (query.length === 0) {
    return { query: "", groups: [], totalResults: 0 };
  }

  const folded = fold(query);
  const bookMap = new Map(snapshot.books.map((book) => [book.id, book]));

  const produced: Record<SearchGroupId, SearchResult[]> = {
    books: [],
    summaries: [],
    notes: [],
    quotes: [],
    mindmaps: [],
  };

  if (requested.includes("books")) {
    produced.books = scoreBooks(snapshot.books, folded);
  }
  if (requested.includes("summaries")) {
    produced.summaries = scoreSummaries(snapshot.summaries, bookMap, folded);
  }
  if (requested.includes("notes")) {
    produced.notes = scoreNotes(snapshot.notes, bookMap, folded);
  }
  if (requested.includes("quotes")) {
    produced.quotes = scoreQuotes(snapshot.quotes, bookMap, folded);
  }
  if (requested.includes("mindmaps")) {
    produced.mindmaps = scoreMindMaps(snapshot.mindMaps, bookMap, folded);
  }

  const groups = SEARCH_GROUP_IDS.filter((id) => requested.includes(id)).map(
    (id) => ({
      id,
      label: SEARCH_GROUP_LABELS[id],
      results: max > 0 ? produced[id].slice(0, max) : produced[id],
      total: produced[id].length,
    }),
  );

  const totalResults = groups.reduce((sum, group) => sum + group.total, 0);

  return { query, groups, totalResults };
}
