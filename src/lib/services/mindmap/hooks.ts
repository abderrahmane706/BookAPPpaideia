import { useMemo, useSyncExternalStore } from "react";
import { library } from "@/lib/services/library/store";
import type { MindMap } from "@/lib/types/mindmap";

/**
 * Reactive hooks over the mind-map slice of the library store. Mind maps share
 * the single global store (and its cross-tab sync) with the rest of the app, so
 * there is no competing source of truth.
 */

export function useMindMapSnapshot() {
  return useSyncExternalStore(
    library.subscribe,
    library.getSnapshot,
    library.getServerSnapshot,
  );
}

export function useMindMapReady(): boolean {
  return useSyncExternalStore(library.subscribe, library.isReady, () => false);
}

/** All maps for a book, most-recently-updated first. */
export function useMindMaps(bookId: string): MindMap[] {
  const snapshot = useMindMapSnapshot();
  return useMemo(
    () =>
      snapshot.mindMaps
        .filter((map) => map.bookId === bookId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [snapshot.mindMaps, bookId],
  );
}

export function useMindMap(id: string | null | undefined): MindMap | null {
  const snapshot = useMindMapSnapshot();
  return useMemo(
    () => (id ? snapshot.mindMaps.find((map) => map.id === id) ?? null : null),
    [snapshot.mindMaps, id],
  );
}
