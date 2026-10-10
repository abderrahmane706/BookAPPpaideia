"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ThemeManager, type Theme } from "@/lib/services/theme/ThemeManager";
import { SoundManager } from "@/lib/services/sound/SoundManager";

/** Subscribe to ThemeManager's active theme (external store pattern). */
function subscribe(onStoreChange: () => void) {
  return ThemeManager.subscribe(onStoreChange);
}

/**
 * ThemeToggle — the explicit Light / Night control in the settings area.
 * Fully keyboard-accessible with a clear label and pressed state. The theme is
 * applied on <html> (data-theme) and persisted by ThemeManager; the pre-paint
 * script in the root layout prevents any flash of the wrong theme on reload.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    () => ThemeManager.value,
    () => "light" as Theme, // server snapshot; the client snapshot wins on mount
  );

  const isDark = theme === "dark";

  const handleToggle = useCallback(() => {
    ThemeManager.toggle();
    // A quiet confirmation, only when the user has opted into interface sound.
    SoundManager.playToggle();
  }, []);

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to night theme"}
      className="btn-press flex items-center gap-2 text-left"
    >
      <span
        aria-hidden
        className="flex h-5 w-5 items-center justify-center border border-line-strong text-[10px] text-engraving"
      >
        {isDark ? "☾" : "☀"}
      </span>
      <span className="small-caps text-ink-faint">
        {isDark ? "Night" : "Light"}
      </span>
    </button>
  );
}
