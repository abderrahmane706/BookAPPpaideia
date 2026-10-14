import type { Book } from "@/lib/types/book";
import type { Note, Quote } from "@/lib/types/library";
import {
  REVIEW_SOURCE_LABELS,
  type ReviewItem,
  type ReviewSourceType,
} from "@/lib/types/review";
import { library } from "@/lib/services/library/store";

/**
 * Agora — mapping the reader's own material into review items.
 *
 * A review item is always built from something the reader wrote or saved. We
 * snapshot the text at queue time so the review survives later edits to (or
 * deletion of) the source, while keeping a link back to the book when one
 * exists. No generated content is ever queued.
 */

export const REVIEW_PROMPT_MAX = 280;
export const REVIEW_ANSWER_MAX = 2000;

function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Human label for an item's source, e.g. "Quotation". */
export function sourceLabel(item: ReviewItem): string {
  return REVIEW_SOURCE_LABELS[item.sourceType];
}

/**
 * Where an item lives in the workspace. Notes and quotations open their own
 * section (#notes / #quotes); reflections and summaries open #review /
 * #summary. We never fall back to a dashboard-style route.
 */
export function reviewSourceHref(item: ReviewItem): string {
  const base = `/library/${item.bookId}`;
  switch (item.sourceType) {
    case "note":
      return `${base}#notes`;
    case "quote":
      return `${base}#quotes`;
    case "summary":
      return `${base}#summary`;
    case "key_takeaway":
    case "most_important_idea":
    case "personal_application":
    case "personal_review":
      return `${base}#review`;
    default:
      return base;
  }
}

/** Queue a note: recall the note's substance, reveal the body. */
export function queueNote(note: Note): ReviewItem | null {
  if (library.findReviewBySource("note", note.id)) return null;
  const answer = clamp(note.body.trim(), REVIEW_ANSWER_MAX);
  if (answer.length === 0) return null;
  const prompt = clamp(
    note.title?.trim() || `Recall the note "${answer.slice(0, 40)}…"`,
    REVIEW_PROMPT_MAX,
  );
  return library.createReview({
    bookId: note.bookId,
    sourceType: "note",
    sourceId: note.id,
    prompt,
    answer,
  });
}

/** Queue a quotation: recall its wording (or its gist), reveal the passage. */
export function queueQuote(quote: Quote): ReviewItem | null {
  if (library.findReviewBySource("quote", quote.id)) return null;
  const answer = clamp(quote.text.trim(), REVIEW_ANSWER_MAX);
  if (answer.length === 0) return null;
  const where = quote.page === null ? "" : ` (p. ${quote.page})`;
  const prompt = clamp(
    `What does this passage${where} say?`,
    REVIEW_PROMPT_MAX,
  );
  return library.createReview({
    bookId: quote.bookId,
    sourceType: "quote",
    sourceId: quote.id,
    prompt,
    answer,
  });
}

const REFLECTION_PROMPTS: Record<
  Extract<
    ReviewSourceType,
    | "key_takeaway"
    | "most_important_idea"
    | "personal_application"
    | "personal_review"
  >,
  (title: string) => string
> = {
  key_takeaway: (title) => `What was your key takeaway from ${title}?`,
  most_important_idea: (title) => `What was the most important idea in ${title}?`,
  personal_application: (title) => `How did you intend to apply ${title}?`,
  personal_review: (title) => `What did you think of ${title}?`,
};

/** Map a reflection review source to the book field that holds its text. */
const REFLECTION_FIELDS: Record<
  keyof typeof REFLECTION_PROMPTS,
  "keyTakeaway" | "mostImportantIdea" | "personalApplication" | "personalReview"
> = {
  key_takeaway: "keyTakeaway",
  most_important_idea: "mostImportantIdea",
  personal_application: "personalApplication",
  personal_review: "personalReview",
};

export type ReflectionKind = keyof typeof REFLECTION_PROMPTS;

/**
 * Queue one of the book's reflection fields. Returns null when the field is
 * empty or already queued.
 */
export function queueReflection(
  book: Book,
  kind: keyof typeof REFLECTION_PROMPTS,
): ReviewItem | null {
  const raw = book[REFLECTION_FIELDS[kind]];
  const answer = clamp(
    typeof raw === "string" ? raw.trim() : "",
    REVIEW_ANSWER_MAX,
  );
  if (answer.length === 0) return null;
  if (library.findReviewBySource(kind, book.id)) return null;
  return library.createReview({
    bookId: book.id,
    sourceType: kind,
    sourceId: book.id,
    prompt: clamp(REFLECTION_PROMPTS[kind](book.title), REVIEW_PROMPT_MAX),
    answer,
  });
}

export { scheduleReview, applyFeedback, isDue, compareDue } from "./scheduler";
export * from "./hooks";

/* ------------------------------------------------------------------ */
/* A daily reflection prompt — a small, fixed contemplative rotation.  */
/* ------------------------------------------------------------------ */

const REFLECTION_PROMPT_LINES = [
  "What did you read today that changed how you see something?",
  "Which idea from your reading is worth carrying into tomorrow?",
  "Where did a book disagree with you — and were you right to resist?",
  "What have you read that you could explain to someone else in a sentence?",
  "Which passage deserves to be revisited rather than merely remembered?",
  "What question did your reading leave unanswered?",
  "What did you notice on a second reading that you missed the first time?",
  "Which of your notes still feels true — and which no longer does?",
  "What would you read differently if you began again today?",
  "Which idea has quietly become part of how you think?",
];

/** A stable contemplation for a given day (deterministic, no randomness). */
export function promptOfTheDay(date: Date = new Date()): string {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  const index =
    ((dayOfYear % REFLECTION_PROMPT_LINES.length) +
      REFLECTION_PROMPT_LINES.length) %
    REFLECTION_PROMPT_LINES.length;
  return REFLECTION_PROMPT_LINES[index];
}
