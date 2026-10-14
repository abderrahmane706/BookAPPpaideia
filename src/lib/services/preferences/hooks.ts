"use client";

import { useSyncExternalStore } from "react";
import type { ExperiencePreferences } from "@/lib/types/experience";
import { experience } from "./store";
import { threshold, type ThresholdSnapshot } from "./entrance";

/** Device-local experience preferences (server snapshot is the default). */
export function useExperience(): ExperiencePreferences {
  return useSyncExternalStore(
    experience.subscribe,
    experience.getSnapshot,
    experience.getServerSnapshot,
  );
}

/** True once the client has hydrated the preferences. */
export function useExperienceReady(): boolean {
  return useSyncExternalStore(experience.subscribe, experience.isReady, () => false);
}

/** The current threshold entrance state (open / evaluated). */
export function useThreshold(): ThresholdSnapshot {
  return useSyncExternalStore(
    threshold.subscribe,
    threshold.getSnapshot,
    threshold.getServerSnapshot,
  );
}
