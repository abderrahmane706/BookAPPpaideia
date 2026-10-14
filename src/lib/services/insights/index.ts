/**
 * Reading Insights — data-driven analytics over the reader's own library.
 *
 * Everything here is derived from persisted records (books, sessions, notes,
 * quotes, summaries, mind maps) and the reader-declared annual goal. There is
 * no estimation, no sampling and no psychological inference: when the data is
 * absent the corresponding metric is `null` or zero and the UI is expected to
 * show an explicit empty state.
 */

import {
  READING_STATUS_LABELS,
  READING_STATUSES,
  type ReadingStatus,
} from "@/lib/types/book";
import type { LibrarySnapshot } from "@/lib/services/library/persistence";

/** Aggregate counts of the library's reading states. */
export interface ReadingOverview {
  totalBooks: number;
  currentlyReading: number;
  completed: number;
  paused: number;
  wantToRead: number;
  /** Percentage of the library finished, 0–100. */
  completionRate: number;
  /** Mean of rated books, one decimal, or null when nothing is rated. */
  averageRating: number | null;
}

/** Metrics derived from recorded reading sessions. */
export interface ActivitySummary {
  sessionCount: number;
  totalMinutes: number;
  totalPages: number;
  sessionsThisYear: number;
  minutesThisYear: number;
  averageMinutesPerSession: number | null;
  averagePagesPerSession: number | null;
  lastSessionDate: string | null;
  currentStreakDays: number;
  longestStreakDays: number;
}

/** Progress against the reader-declared annual goal. */
export interface YearProgress {
  year: number;
  booksCompletedThisYear: number;
  annualGoal: number | null;
  /** Percentage toward goal, 0–100+, or null when no goal is set. */
  goalProgress: number | null;
  minutesThisYear: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface StatusCount {
  status: ReadingStatus;
  label: string;
  count: number;
}

export interface TimelinePoint {
  /** `YYYY-MM`. */
  month: string;
  /** Short month label, e.g. `Jan`. */
  label: string;
  sessions: number;
  minutes: number;
  booksCompleted: number;
}

/** Counts of the reader's own writing and mapping. */
export interface ContentCounts {
  summaries: number;
  notes: number;
  quotes: number;
  mindMaps: number;
  /** Agora review items the reader has queued. */
  reviews: number;
}

export interface ReadingInsights {
  /** True when at least one book has been recorded. */
  hasLibrary: boolean;
  /** True when at least one reading session has been recorded. */
  hasActivity: boolean;
  overview: ReadingOverview;
  activity: ActivitySummary;
  year: YearProgress;
  categories: CategoryCount[];
  statuses: StatusCount[];
  /** The most recent 12 months, oldest first. */
  timeline: TimelinePoint[];
  content: ContentCounts;
  topCategory: string | null;
}

export interface InsightOptions {
  /** Reader-declared annual book goal (null when unset). */
  annualGoal?: number | null;
  /** Injection point for tests. Defaults to `new Date()`. */
  now?: Date;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Local `YYYY-MM-DD` for a date (avoids UTC off-by-one on the streak). */
function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(date: Date): string {
  return localDateKey(date).slice(0, 7);
}

function classifyCategory(category: string): string {
  const trimmed = category.trim();
  return trimmed.length > 0 ? trimmed : "Uncategorised";
}

/** Compute the full insight set from a persisted library snapshot. */
export function computeInsights(
  snapshot: LibrarySnapshot,
  options: InsightOptions = {},
): ReadingInsights {
  const now = options.now ?? new Date();
  const year = now.getFullYear();
  const yearPrefix = `${year}-`;

  const books = snapshot.books;

  /* ----- overview ----- */
  const completed = books.filter((b) => b.status === "completed").length;
  const currentlyReading = books.filter((b) => b.status === "reading").length;
  const paused = books.filter((b) => b.status === "paused").length;
  const wantToRead = books.filter((b) => b.status === "want_to_read").length;
  const rated = books.filter((b) => b.rating !== null);
  const averageRating =
    rated.length > 0
      ? Math.round(
          (rated.reduce((sum, b) => sum + (b.rating ?? 0), 0) / rated.length) * 10,
        ) / 10
      : null;

  const overview: ReadingOverview = {
    totalBooks: books.length,
    currentlyReading,
    completed,
    paused,
    wantToRead,
    completionRate:
      books.length > 0 ? Math.round((completed / books.length) * 100) : 0,
    averageRating,
  };

  /* ----- activity (sessions) ----- */
  const sessions = snapshot.sessions;
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const pagesSessions = sessions.filter(
    (s) => typeof s.pages === "number" && s.pages > 0,
  );
  const totalPages = pagesSessions.reduce((sum, s) => sum + (s.pages ?? 0), 0);
  const sessionsThisYear = sessions.filter((s) =>
    s.date.startsWith(yearPrefix),
  );
  const minutesThisYear = sessionsThisYear.reduce(
    (sum, s) => sum + (s.minutes || 0),
    0,
  );

  const lastSessionDate =
    sessions.length > 0
      ? sessions.reduce(
          (latest, s) => (s.date > latest ? s.date : latest),
          sessions[0].date,
        )
      : null;

  const { current, longest } = computeStreaks(sessions.map((s) => s.date), now);

  const activity: ActivitySummary = {
    sessionCount: sessions.length,
    totalMinutes,
    totalPages,
    sessionsThisYear: sessionsThisYear.length,
    minutesThisYear,
    averageMinutesPerSession:
      sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : null,
    averagePagesPerSession:
      pagesSessions.length > 0
        ? Math.round(totalPages / pagesSessions.length)
        : null,
    lastSessionDate,
    currentStreakDays: current,
    longestStreakDays: longest,
  };

  /* ----- annual goal ----- */
  const completedThisYear = books.filter(
    (b) => b.completedAt && b.completedAt.startsWith(yearPrefix),
  ).length;
  const annualGoal =
    typeof options.annualGoal === "number" && options.annualGoal > 0
      ? Math.round(options.annualGoal)
      : null;

  const yearProgress: YearProgress = {
    year,
    booksCompletedThisYear: completedThisYear,
    annualGoal,
    goalProgress:
      annualGoal !== null
        ? Math.round((completedThisYear / annualGoal) * 100)
        : null,
    minutesThisYear,
  };

  /* ----- categories & statuses ----- */
  const categoryMap = new Map<string, number>();
  for (const book of books) {
    const key = classifyCategory(book.category);
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
  }
  const categories = Array.from(categoryMap, ([category, count]) => ({
    category,
    count,
  })).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  const statuses: StatusCount[] = READING_STATUSES.map((status) => ({
    status,
    label: READING_STATUS_LABELS[status],
    count: books.filter((b) => b.status === status).length,
  }));

  /* ----- 12-month timeline ----- */
  const timeline = buildTimeline(sessions, books, now);

  /* ----- content counts ----- */
  const content: ContentCounts = {
    summaries: Object.keys(snapshot.summaries).length,
    notes: snapshot.notes.length,
    quotes: snapshot.quotes.length,
    mindMaps: snapshot.mindMaps.length,
    reviews: snapshot.reviews.length,
  };

  return {
    hasLibrary: books.length > 0,
    hasActivity: sessions.length > 0,
    overview,
    activity,
    year: yearProgress,
    categories,
    statuses,
    timeline,
    content,
    topCategory: categories[0]?.category ?? null,
  };
}

function buildTimeline(
  sessions: LibrarySnapshot["sessions"],
  books: LibrarySnapshot["books"],
  now: Date,
): TimelinePoint[] {
  const months: TimelinePoint[] = [];
  const index = new Map<string, TimelinePoint>();

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKey(date);
    const point: TimelinePoint = {
      month: key,
      label: MONTH_LABELS[date.getMonth()],
      sessions: 0,
      minutes: 0,
      booksCompleted: 0,
    };
    months.push(point);
    index.set(key, point);
  }

  for (const session of sessions) {
    const point = index.get(session.date.slice(0, 7));
    if (!point) continue;
    point.sessions += 1;
    point.minutes += session.minutes || 0;
  }

  for (const book of books) {
    if (!book.completedAt) continue;
    const point = index.get(book.completedAt.slice(0, 7));
    if (point) point.booksCompleted += 1;
  }

  return months;
}

/** Consecutive-day streaks from a list of `YYYY-MM-DD` dates. */
function computeStreaks(
  dates: string[],
  now: Date,
): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const unique = Array.from(new Set(dates)).sort();
  const dayMs = 24 * 60 * 60 * 1000;
  const toTime = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i += 1) {
    if (toTime(unique[i]) - toTime(unique[i - 1]) === dayMs) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak: walk back from today (or yesterday if today is idle).
  const today = localDateKey(now);
  const last = unique[unique.length - 1];
  const spanFromToday = Math.round((toTime(today) - toTime(last)) / dayMs);
  let current = 0;
  if (spanFromToday <= 1) {
    current = 1;
    for (let i = unique.length - 1; i > 0; i -= 1) {
      if (toTime(unique[i]) - toTime(unique[i - 1]) === dayMs) current += 1;
      else break;
    }
  }

  return { current, longest };
}
