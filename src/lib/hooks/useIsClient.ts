"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * True once the client has mounted; false during SSR and the hydration pass.
 * Lets client-only UI (portals, date-derived content) avoid hydration
 * mismatches without a setState-in-effect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
