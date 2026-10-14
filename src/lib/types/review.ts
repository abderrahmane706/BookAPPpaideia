/**
 * Agora review domain types — daily recall & reflection.
 *
 * A review item is a *pointer* to the reader's own saved knowledge (a note, a
 * quotation, a key takeaway, a reflection, a summary passage) plus a snapshot of
 * the prompt/answer text at the moment it was queued. The snapshot preserves the
 * review context if the source later changes; the source id keeps the link back
 * to the book record.
 *
 * Scheduling is a modest, deterministic, spaced-review model (see
 * services/review/scheduler.ts). It is NOT presented as a scientifically
 * validated predictor of retention.
 */

export type ReviewSourceType =
  | "note"
  | "quote"
  | "key_takeaway"
  | "most_important_idea"
  | "personal_application"
  | "personal_review"
  | "summary";

export const REVIEW_SOURCE_TYPES: ReviewSourceType[] = [
  "note",
  "quote",
  "key_takeaway",
  "most_important_idea",
  "personal_application",
  "personal_review",
  "summary",
];

export const REVIEW_SOURCE_LABELS: Record<ReviewSourceType, string> = {
  note: "Note",
  quote: "Quotation",
  key_takeaway: "Key takeaway",
  most_important_idea: "Most important idea",
  personal_application: "Personal application",
  personal_review: "Personal review",
  summary: "Summary",
};

/** Reader self-assessment of how recall felt this time. */
export type ReviewFeedback = "again" | "difficult" | "good" | "easy";

export const REVIEW_FEEDBACKS: ReviewFeedback[] = [
  "again",
  "difficult",
  "good",
  "easy",
];

export const REVIEW_FEEDBACK_LABELS: Record<ReviewFeedback, string> = {
  again: "Again",
  difficult: "Difficult",
  good: "Good",
  easy: "Easy",
};

/**
 * Lifecycle of an item. "New" until first reviewed; "Learning" while the
 * interval is short; "Review" once it is being spaced out; "Suspended" when the
 * reader has paused it (never shown in the due queue).
 */
export type ReviewState = "new" | "learning" | "review" | "suspended";

export interface ReviewItem {
  id: string;
  bookId: string;
  sourceType: ReviewSourceType;
  /** Id of the source record, when it has one (notes/quotes have ids). */
  sourceId: string | null;
  /** The question shown first. */
  prompt: string;
  /** The saved answer / reference revealed after recall. */
  answer: string;
  lastReviewedAt: string | null;
  /** ISO timestamp; an item is due when this is at or before "now". */
  nextReviewAt: string;
  intervalDays: number;
  repetitions: number;
  reviewState: ReviewState;
  createdAt: string;
  updatedAt: string;
}

/** The scheduling half of a review item. */
export interface ReviewSchedule {
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
  reviewState: ReviewState;
}

export const REVIEW_INTERVAL_MAX_DAYS = 365;

/** Create-input for the store (ids/timestamps are assigned by the store). */
export interface ReviewCreateInput {
  bookId: string;
  sourceType: ReviewSourceType;
  sourceId?: string | null;
  prompt: string;
  answer: string;
}
