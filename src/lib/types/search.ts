/**
 * Global-search domain types.
 *
 * Search operates over the reader's own local library snapshot. It is a pure
 * projection — nothing is fetched or mutated — so results always reflect
 * exactly what the reader has stored on this device.
 */

/** The searchable collections, in the order they are presented. */
export const SEARCH_GROUP_IDS = [
  "books",
  "summaries",
  "notes",
  "quotes",
  "mindmaps",
] as const;

export type SearchGroupId = (typeof SEARCH_GROUP_IDS)[number];

export const SEARCH_GROUP_LABELS: Record<SearchGroupId, string> = {
  books: "Books",
  summaries: "Summaries",
  notes: "Notes",
  quotes: "Quotations",
  mindmaps: "Mind Maps",
};

/** Human label for the kind of record a result points at. */
export const SEARCH_RESULT_KIND_LABELS: Record<SearchGroupId, string> = {
  books: "Book",
  summaries: "Summary",
  notes: "Note",
  quotes: "Quotation",
  mindmaps: "Mind map",
};

export interface SearchResult {
  /** Stable id of the underlying record. */
  id: string;
  group: SearchGroupId;
  /** Primary line: the record's own title/label. */
  title: string;
  /** Secondary line: the owning book, author, etc. Null when redundant. */
  subtitle: string | null;
  /** A short window of context around the match (may equal the title). */
  snippet: string;
  /** Deep link into the owning book workspace / mind-map screen. */
  href: string;
  /** Higher is a better match. Used for ordering only. */
  score: number;
  /** ISO timestamp used as a recency tie-breaker. */
  updatedAt: string;
}

export interface SearchGroup {
  id: SearchGroupId;
  label: string;
  /** Results after the per-group cap. */
  results: SearchResult[];
  /** Total matches found before the per-group cap. */
  total: number;
}

export interface SearchResponse {
  query: string;
  groups: SearchGroup[];
  /** Total matches across every searched group (before caps). */
  totalResults: number;
}
