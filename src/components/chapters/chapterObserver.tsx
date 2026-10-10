"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { PageTurnTransition } from "./PageTurnTransition";

export interface ChapterNavItem {
  index: string;
  label: string;
  id: string;
}

interface ActiveChapterValue {
  /** The id of the chapter currently dominant in the viewport, or null. */
  activeChapter: string | null;
  /** Chapters registered with the observer (config). */
  chapters: ChapterNavItem[];
  /** Deliberately navigate to a chapter — scrolls and fires the page-turn. */
  navigateToChapter: (id: string) => void;
}

const ActiveChapterContext = createContext<ActiveChapterValue | null>(null);

/**
 * ActiveChapterProvider — the single source of truth for which chapter is
 * currently active. Runs ONE IntersectionObserver over all registered chapter
 * sections and updates a single `activeChapter` value consumed by both the
 * chapter navigation and the sidebar.
 *
 * The page-turn parchment sweep and its sound fire ONLY on *deliberate*
 * navigation (a nav/sidebar click calling `navigateToChapter`) — never on the
 * ordinary scroll that changes the active chapter. This keeps the transition
 * meaningful and prevents repeated sweeps/sounds while scrolling.
 */
export function ActiveChapterProvider({
  chapters,
  children,
}: {
  chapters: ChapterNavItem[];
  children: ReactNode;
}) {
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [turnTrigger, setTurnTrigger] = useState(0);
  const transitionGuard = useRef(false);

  useEffect(() => {
    const sections = chapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sections.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActiveChapter(chapters[idx].id);
          }
        });
      },
      { threshold: [0.25, 0.45, 0.65], rootMargin: "-15% 0px -15% 0px" },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [chapters]);

  /**
   * Deliberate navigation: scroll to the chapter and play the page-turn.
   * Guarded so a burst of clicks produces a single, coherent turn.
   */
  const navigateToChapter = useCallback((id: string) => {
    scrollToChapter(id);
    if (transitionGuard.current) return;
    transitionGuard.current = true;
    SoundManager.playChapterTransition();
    setTurnTrigger((n) => n + 1);
    window.setTimeout(() => {
      transitionGuard.current = false;
    }, 600);
  }, []);

  const value = useMemo<ActiveChapterValue>(
    () => ({ activeChapter, chapters, navigateToChapter }),
    [activeChapter, chapters, navigateToChapter],
  );

  return (
    <ActiveChapterContext.Provider value={value}>
      {children}
      <PageTurnTransition trigger={turnTrigger} />
    </ActiveChapterContext.Provider>
  );
}

export function useActiveChapter(): ActiveChapterValue {
  const ctx = useContext(ActiveChapterContext);
  if (!ctx) {
    // Allow graceful degradation (e.g. outside a provider) instead of crashing.
    return {
      activeChapter: null,
      chapters: [],
      navigateToChapter: scrollToChapter,
    };
  }
  return ctx;
}

/** Smoothly scroll to a chapter by its id. */
export function scrollToChapter(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
