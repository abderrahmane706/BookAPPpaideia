"use client";

import { useCallback, useSyncExternalStore } from "react";
import { SoundManager } from "@/lib/services/sound/SoundManager";

/** Subscribe to SoundManager's enabled state (external store pattern). */
function subscribe(onStoreChange: () => void) {
  return SoundManager.subscribe(onStoreChange);
}

/**
 * SoundToggle — a small speaker toggle placed in the Sidebar settings area.
 * Persists the preference via SoundManager (localStorage). Respects autoplay
 * policy: the first toggle click doubles as the AudioContext unlock gesture.
 */
export function SoundToggle() {
  const enabled = useSyncExternalStore(
    subscribe,
    () => SoundManager.isEnabled,
    () => false, // server snapshot — default OFF; client snapshot wins on mount
  );

  const handleToggle = useCallback(() => {
    const next = !SoundManager.isEnabled;
    SoundManager.setEnabled(next);
    // Play the toggle sound only when turning ON (turning OFF is silent).
    if (next) SoundManager.playToggle();
  }, []);

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute interface sounds" : "Unmute interface sounds"}
      className="btn-press flex items-center gap-2 text-left"
    >
      <span
        aria-hidden
        className="flex h-5 w-5 items-center justify-center border border-line-strong text-[10px] text-engraving"
      >
        {enabled ? "♪" : "∅"}
      </span>
      <span className="small-caps text-ink-faint">
        {enabled ? "Sound on" : "Sound off"}
      </span>
    </button>
  );
}
