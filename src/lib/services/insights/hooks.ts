"use client";

import { useMemo } from "react";
import { useLibrarySnapshot } from "@/lib/services/library/hooks";
import { useProfile } from "@/lib/services/profile";
import { computeInsights, type ReadingInsights } from "./index";

/**
 * Reactive reading insights for the current device.
 *
 * Recomputed only when the library snapshot or the declared annual goal
 * changes — never on an interval, and never from fabricated data.
 */
export function useReadingInsights(): ReadingInsights {
  const snapshot = useLibrarySnapshot();
  const profile = useProfile();

  return useMemo(
    () => computeInsights(snapshot, { annualGoal: profile.annualGoal }),
    [snapshot, profile.annualGoal],
  );
}
