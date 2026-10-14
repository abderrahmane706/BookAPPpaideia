import {
  REVIEW_INTERVAL_MAX_DAYS,
  type ReviewFeedback,
  type ReviewItem,
  type ReviewSchedule,
} from "@/lib/types/review";

/**
 * Deterministic spaced-review scheduler.
 *
 * This is a deliberately small, transparent model inspired by graduated
 * interval recall. It is NOT a scientifically validated retention predictor and
 * the product never claims it is — it simply answers "what is worth revisiting
 * today?" in a stable, testable way.
 *
 * Rules (all pure, all documented):
 *  - "Again"     → the item failed recall. Repetitions reset to 0, interval to 0
 *                  days and it is due immediately so it can reappear in the same
 *                  session. State becomes "learning".
 *   First time an item graduates (repetitions 0 -> 1):
 *     difficult = 1 day, good = 1 day, easy = 3 days.
 *   Afterwards the interval is multiplied:
 *     difficult ×1.2, good ×2.0, easy ×2.6
 *   rounded to whole days and clamped to [1, REVIEW_INTERVAL_MAX_DAYS].
 * "Review" state begins once an item has been recalled successfully twice.
 */

const FIRST_INTERVAL: Record<Exclude<ReviewFeedback, "again">, number> = {
  difficult: 1,
  good: 1,
  easy: 3,
};

const GROWTH: Record<ReviewFeedback, number> = {
  again: 0,
  difficult: 1.2,
  good: 2.0,
  easy: 2.6,
};

export interface SchedulingClock {
  /** Injection point for tests. Defaults to `new Date()`. */
  now?: Date;
}

export function scheduleReview(
  current: Pick<ReviewItem, "intervalDays" | "repetitions">,
  feedback: ReviewFeedback,
  now: Date = new Date(),
): ReviewSchedule {
  if (feedback === "again") {
    return {
      intervalDays: 0,
      repetitions: 0,
      nextReviewAt: now.toISOString(),
      reviewState: "learning",
    };
  }

  const repetitions = current.repetitions + 1;
  let interval: number;

  if (current.repetitions === 0) {
    interval = FIRST_INTERVAL[feedback];
  } else {
    interval = Math.max(
      1,
      Math.round(current.intervalDays * GROWTH[feedback]),
    );
  }

  interval = Math.min(REVIEW_INTERVAL_MAX_DAYS, interval);
  const nextReviewAt = addDays(now, interval).toISOString();

  return {
    intervalDays: interval,
    repetitions,
    nextReviewAt,
    reviewState: repetitions >= 2 ? "review" : "learning",
  };
}

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Apply a feedback answer to an item. Pure: returns the next item without
 * mutating the input.
 */
export function applyFeedback(
  item: ReviewItem,
  feedback: ReviewFeedback,
  now: Date = new Date(),
): ReviewItem {
  const schedule = scheduleReview(item, feedback, now);
  return {
    ...item,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: schedule.nextReviewAt,
    intervalDays: schedule.intervalDays,
    repetitions: schedule.repetitions,
    reviewState: schedule.reviewState,
    updatedAt: now.toISOString(),
  };
}

/** True when an item should appear in today's queue. */
export function isDue(item: ReviewItem, now: Date = new Date()): boolean {
  if (item.reviewState === "suspended") return false;
  return Date.parse(item.nextReviewAt) <= now.getTime();
}

/**
 * A stable ordering for the due queue: soonest-due first, then oldest queued,
 * then id (so the order never depends on array insertion details).
 */
export function compareDue(a: ReviewItem, b: ReviewItem): number {
  const aDue = Date.parse(a.nextReviewAt);
  const bDue = Date.parse(b.nextReviewAt);
  if (aDue !== bDue) return aDue - bDue;
  const aCreated = Date.parse(a.createdAt);
  const bCreated = Date.parse(b.createdAt);
  if (aCreated !== bCreated) return aCreated - bCreated;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
