"use client";

/**
 * PageTurnTransition — a brief, subtle parchment sweep rendered when the
 * active chapter changes. Mount it once inside ActiveChapterProvider.
 *
 * 350–400ms directional sweep — refined, not a dramatic 3D curl.
 * The element is keyed by `trigger` so each new transition remounts it,
 * restarting the CSS animation without any React state or effects.
 * Respects prefers-reduced-motion (the CSS collapses to an instant fade).
 */
export function PageTurnTransition({
  trigger,
}: {
  /** Change this value to fire the sweep. Ignored while 0 (first mount). */
  trigger: number;
}) {
  if (trigger === 0) return null;

  return <div key={trigger} aria-hidden className="page-turn" />;
}
