"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useLibrarySnapshot } from "@/lib/services/library";
import { searchLibrary } from "@/lib/services/search";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import {
  SEARCH_GROUP_IDS,
  SEARCH_GROUP_LABELS,
  SEARCH_RESULT_KIND_LABELS,
  type SearchGroupId,
  type SearchResult,
} from "@/lib/types/search";

const DEBOUNCE_MS = 300;

type Filter = SearchGroupId | "all";

const FILTER_ORDER: Filter[] = ["all", ...SEARCH_GROUP_IDS];

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/** Highlight the first case-insensitive occurrence of the query. */
function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-[2px] bg-gold/25 px-0.5 text-ink">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

/**
 * Global search overlay (⌘K / Ctrl-K).
 *
 * Operates entirely on the reader's local library snapshot — no fetching per
 * keystroke. Input is debounced; results are grouped per collection with deep
 * links into the owning book workspace or mind-map screen.
 */
export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const mounted = useIsClient();
  const snapshot = useLibrarySnapshot();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce input so we never rescan the snapshot on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Move focus into the field whenever the overlay is presented. (The overlay
  // is remounted via a `key` on each open, so its state starts fresh.)
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const response = useMemo(
    () =>
      searchLibrary(snapshot, debounced, {
        groups: filter === "all" ? undefined : [filter],
      }),
    [snapshot, debounced, filter],
  );

  const flat = useMemo<SearchResult[]>(
    () => response.groups.flatMap((group) => group.results),
    [response],
  );

  // Clamp during render so a shrinking result set never points past the end;
  // handlers reset to the top explicitly.
  const activeIndex = flat.length === 0 ? 0 : Math.min(active, flat.length - 1);

  const navigate = (result: SearchResult) => {
    SoundManager.playClick();
    onClose();
    router.push(result.href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(flat.length === 0 ? 0 : (activeIndex + 1) % flat.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(
        flat.length === 0 ? 0 : (activeIndex - 1 + flat.length) % flat.length,
      );
      return;
    }
    if (event.key === "Enter") {
      const target = flat[activeIndex];
      if (target) {
        event.preventDefault();
        navigate(target);
      }
    }
  };

  // Keep the active row in view during keyboard navigation.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-result-index="${activeIndex}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!mounted || !open) return null;

  const showEmpty = debounced.length > 0 && response.totalResults === 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] pb-6"
      role="dialog"
      aria-modal="true"
      aria-label="Search your library"
      onKeyDown={onKeyDown}
    >
      <button
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-scrim backdrop-blur-sm"
      />
      <div className="relative flex max-h-[76vh] w-full max-w-2xl flex-col overflow-hidden rounded-radius-lg border border-line-strong bg-surface-raised shadow-card-hover">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span aria-hidden className="text-ink-faint">
            ⌕
          </span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={response.totalResults > 0}
            aria-controls="global-search-results"
            aria-label="Search your library"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search books, summaries, notes, quotations and mind maps…"
            className="w-full bg-transparent font-body text-base text-ink placeholder:text-ink-faint/70 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-line-strong px-1.5 py-0.5 font-utility text-[10px] uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-ink"
          >
            Esc
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-line bg-parchment-shade/20 px-4 py-2.5">
          {FILTER_ORDER.map((id) => {
            const isActive = filter === id;
            const label = id === "all" ? "All" : SEARCH_GROUP_LABELS[id];
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  SoundManager.playToggle();
                  setFilter(id);
                  setActive(0);
                }}
                className={cn(
                  "border px-2.5 py-1 font-utility text-[11px] uppercase tracking-[0.1em] transition-colors",
                  isActive
                    ? "border-engraving bg-engraving text-surface"
                    : "border-line-strong bg-surface text-ink-soft hover:border-engraving hover:text-engraving-deep",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {debounced.length === 0 ? (
            <p className="px-4 py-8 text-center font-body text-sm text-ink-faint">
              Begin typing to search across your library.
            </p>
          ) : showEmpty ? (
            <p className="px-4 py-8 text-center font-body text-sm text-ink-soft">
              No results for “{debounced}”.
            </p>
          ) : (
            <div className="py-1.5">
              {response.groups.map((group) => {
                if (group.results.length === 0) return null;
                return (
                  <section key={group.id} className="px-2 py-1.5">
                    <h3 className="px-2 pb-1 font-utility text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                      {group.label}
                      {group.total > group.results.length ? (
                        <span className="ml-2 text-ink-faint">
                          {group.results.length} of {group.total}
                        </span>
                      ) : null}
                    </h3>
                    <ul>
                      {group.results.map((result) => {
                        const index = flat.indexOf(result);
                        const isActive = index === activeIndex;
                        return (
                          <li key={`${result.group}:${result.id}`}>
                            <button
                              type="button"
                              data-result-index={index}
                              onMouseEnter={() => setActive(index)}
                              onClick={() => navigate(result)}
                              className={cn(
                                "flex w-full flex-col gap-0.5 rounded-radius-sm px-2 py-2 text-left transition-colors",
                                isActive
                                  ? "bg-engraving/10"
                                  : "hover:bg-engraving/5",
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <span className="truncate font-body text-sm text-ink">
                                  {highlight(result.title, debounced)}
                                </span>
                                <span className="ml-auto shrink-0 font-utility text-[9px] uppercase tracking-[0.12em] text-ink-faint">
                                  {SEARCH_RESULT_KIND_LABELS[result.group]}
                                </span>
                              </span>
                              {result.subtitle ? (
                                <span className="truncate font-utility text-[11px] text-ink-faint">
                                  {highlight(result.subtitle, debounced)}
                                </span>
                              ) : null}
                              {result.snippet &&
                              result.snippet !== result.title ? (
                                <span className="line-clamp-2 font-body text-xs leading-relaxed text-ink-soft">
                                  {highlight(result.snippet, debounced)}
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-line px-4 py-2 font-utility text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          <span className="flex items-center gap-3">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </span>
          <span>
            {response.totalResults > 0
              ? `${response.totalResults} result${response.totalResults === 1 ? "" : "s"}`
              : "Local library only"}
          </span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
