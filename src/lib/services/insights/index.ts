/**
 * Reading Insights domain boundary.
 *
 * A later phase analyzes a reader's evolution (pages read, categories explored,
 * completion rates, streaks) and surfaces "reading intelligence". The analytics
 * engine is not implemented now; only the query boundary is defined so the
 * product can grow into it without structural changes.
 */

export interface LibraryOverview {
  totalBooks: number;
  currentlyReading: number;
  completed: number;
  paused: number;
  wantToRead: number;
}

export interface ReadingStatistic {
  key: string;
  label: string;
  value: number;
}

export interface InsightsService {
  libraryOverview(): Promise<LibraryOverview>;
  /** Derived statistics such as completion rate, avg rating, top category. */
  statistics(): Promise<ReadingStatistic[]>;
}

export function getInsightsService(): InsightsService {
  return emptyInsightsService;
}

/** Phase 1 placeholder — returns zeros until the engine exists. */
const emptyInsightsService: InsightsService = {
  async libraryOverview() {
    return {
      totalBooks: 0,
      currentlyReading: 0,
      completed: 0,
      paused: 0,
      wantToRead: 0,
    };
  },
  async statistics() {
    return [];
  },
};
