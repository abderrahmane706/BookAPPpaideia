"use client";

import { cn } from "@/lib/utils/cn";
import { useActiveChapter } from "./chapterObserver";

/**
 * ChapterNavigation — the small "01 02 03 04 05" manuscript indicator.
 * Consumes the single shared active-chapter state so it stays synchronized with
 * the sidebar and the artwork scenes. Clicking a number performs a deliberate
 * navigation (scroll + a single page-turn), never a scroll-triggered sweep.
 */
export function ChapterNavigation() {
  const { chapters, activeChapter, navigateToChapter } = useActiveChapter();

  if (chapters.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1"
      role="navigation"
      aria-label="Chapters"
    >
      {chapters.map((chapter) => {
        const isActive = activeChapter === chapter.id;
        return (
          <button
            key={chapter.id}
            type="button"
            onClick={() => navigateToChapter(chapter.id)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "btn-press relative inline-flex h-7 min-w-7 items-center justify-center px-1.5 font-utility text-xs tracking-wider transition-colors",
              isActive
                ? "font-semibold text-engraving-deep"
                : "text-ink-faint hover:text-ink",
            )}
          >
            {chapter.index}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-1 bottom-0 h-px transition-colors",
                isActive ? "bg-gold" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
