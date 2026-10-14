import { useMemo } from "react";
import type { ReviewItem, ReviewSourceType } from "@/lib/types/review";
import { useLibrarySnapshot } from "@/lib/services/library/hooks";

/**
 * Is a given source record already in the review queue? Used to render
 * "In review" instead of "Add to review".
 */
export function useReviewForSource(
  sourceType: ReviewSourceType,
  sourceId: string,
): ReviewItem | null {
  const snapshot = useLibrarySnapshot();
  return useMemo(
    () =>
      snapshot.reviews.find(
        (r) => r.sourceType === sourceType && r.sourceId === sourceId,
      ) ?? null,
    [snapshot.reviews, sourceType, sourceId],
  );
}

/** Count of items currently due (never suspended), for navigation badges. */
export function useDueCount(now: Date = new Date()): number {
  const snapshot = useLibrarySnapshot();
  return useMemo(() => {
    const stamp = now.getTime();
    return snapshot.reviews.filter(
      (r) =>
        r.reviewState !== "suspended" &&
        Date.parse(r.nextReviewAt) <= stamp,
    ).length;
  }, [snapshot.reviews, now]);
}
