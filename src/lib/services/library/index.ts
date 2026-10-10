/**
 * Library service — the single boundary between persistence and the UI.
 *
 * `store.ts` is the concrete (local-first) implementation; `hooks.ts` exposes
 * it to React. A future Supabase-backed implementation only has to satisfy the
 * same operations — no component imports Supabase directly. See the header of
 * `persistence.ts` for the current persistence boundary and why it is local.
 */
export { library, computeReadingTotals } from "./store";
export {
  useBook,
  useBookDetail,
  useBooks,
  useLibraryReady,
  useLibrarySnapshot,
} from "./hooks";
export type { LibrarySnapshot } from "./persistence";
export { LIBRARY_STORAGE_KEY } from "./persistence";
