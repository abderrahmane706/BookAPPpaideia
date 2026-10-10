import type { ReadingProgress } from "@/lib/types/book";

/** Curated categories used for organizing a personal library. */
export const BOOK_CATEGORIES = [
  "Philosophy",
  "History",
  "Classics",
  "Science",
  "Literature",
  "Poetry",
  "Biography",
  "Self-Development",
  "Art",
  "Other",
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number];

/** Reading progress milestones, in canonical order. */
export const READING_PROGRESS_MILESTONES: ReadingProgress[] = [0, 25, 50, 75, 100];

/**
 * Literary / philosophical quotes shown across the application.
 * Sourced from public-domain classical and literary authors.
 */
export const LIBRARY_QUOTES = [
  {
    text: "Education is the kindling of a flame, not the filling of a vessel.",
    source: "Socrates",
  },
  {
    text: "The unexamined life is not worth living.",
    source: "Plato",
  },
  {
    text: "A reader lives a thousand lives before he dies.",
    source: "George R. R. Martin",
  },
  {
    text: "The only true wisdom is in knowing you know nothing.",
    source: "Socrates",
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    source: "Aristotle",
  },
  {
    text: "There is no friend as loyal as a book.",
    source: "Ernest Hemingway",
  },
] as const;
