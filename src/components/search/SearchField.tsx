"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { SearchOverlay } from "./SearchOverlay";

/**
 * The header's search entry point.
 *
 * Renders a quiet search affordance (not a functional input — activating it
 * opens the full overlay) in two responsive forms from a single instance, and
 * wires the global ⌘K / Ctrl-K shortcut. The shortcut intentionally does
 * nothing else: it never intercepts arrow keys, Escape or Enter outside the
 * overlay, so it cannot hijack an editor or form.
 */
export function SearchField({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  // A monotonic key remounts the overlay on each open, giving it a clean slate
  // without resetting state from inside an effect.
  const [instance, setInstance] = useState(0);
  const mounted = useIsClient();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        SoundManager.playClick();
        setInstance((value) => value + 1);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isMac =
    mounted &&
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  const trigger = () => {
    SoundManager.playClick();
    setInstance((value) => value + 1);
    setOpen(true);
  };

  return (
    <div className={cn("contents", className)}>
      <button
        type="button"
        onClick={trigger}
        aria-label="Search your library"
        aria-haspopup="dialog"
        className="hidden h-9 w-full max-w-xs items-center gap-2 border border-line bg-surface-raised px-3 font-body text-sm text-ink-faint transition-colors hover:border-line-strong hover:text-ink-soft md:flex"
      >
        <span aria-hidden className="text-ink-faint">
          ⌕
        </span>
        <span className="flex-1 truncate text-left">Search books, notes…</span>
        <kbd className="hidden shrink-0 border border-line-strong px-1.5 py-0.5 font-utility text-[10px] text-ink-faint lg:block">
          {mounted ? (isMac ? "⌘K" : "Ctrl K") : "⌘K"}
        </kbd>
      </button>

      <button
        type="button"
        onClick={trigger}
        aria-label="Search your library"
        aria-haspopup="dialog"
        className="flex h-9 w-9 items-center justify-center border border-line bg-surface-raised text-ink-soft transition-colors hover:border-line-strong hover:text-ink md:hidden"
      >
        <span aria-hidden>⌕</span>
      </button>

      <SearchOverlay
        key={instance}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
