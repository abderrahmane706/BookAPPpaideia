"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Book, ReadingStatus } from "@/lib/types/book";
import { READING_STATUS_LABELS } from "@/lib/types/book";
import { cn } from "@/lib/utils/cn";
import { partitionLibrary } from "@/lib/utils/library";
import { BookGrid } from "@/components/books/BookGrid";
import { SoundManager } from "@/lib/services/sound/SoundManager";

type SortKey = "title" | "author" | "rating" | "progress" | "added";

const SORT_LABELS: Record<SortKey, string> = {
  title: "Title",
  author: "Author",
  rating: "Rating",
  progress: "Progress",
  added: "Recently added",
};

const STATUS_FILTERS: Array<ReadingStatus | "all"> = [
  "all",
  "reading",
  "want_to_read",
  "paused",
  "completed",
];

function sortBooks(books: Book[], key: SortKey): Book[] {
  const list = [...books];
  switch (key) {
    case "title":
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case "author":
      return list.sort((a, b) => a.author.localeCompare(b.author));
    case "rating":
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "progress":
      return list.sort((a, b) => b.progress - a.progress);
    case "added":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

/**
 * LibraryBrowser — Chapter III's filterable catalogue.
 * Client-side filter chips (by reading status), a sort control, and a compact
 * status summary derived from the real collection. No server round-trips.
 */
export function LibraryBrowser({ books }: { books: Book[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<ReadingStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("added");

  const summary = useMemo(() => partitionLibrary(books), [books]);

  const visible = useMemo(() => {
    const filtered =
      filter === "all"
        ? books
        : books.filter((b) => b.status === filter);
    return sortBooks(filtered, sort);
  }, [books, filter, sort]);

  const summaryCounts: Array<{ key: ReadingStatus | "all"; label: string; count: number }> = [
    { key: "all", label: "All volumes", count: books.length },
    { key: "reading", label: READING_STATUS_LABELS.reading, count: summary.reading.length },
    { key: "want_to_read", label: READING_STATUS_LABELS.want_to_read, count: summary.wantToRead.length },
    { key: "paused", label: READING_STATUS_LABELS.paused, count: summary.paused.length },
    { key: "completed", label: READING_STATUS_LABELS.completed, count: summary.completed.length },
  ];

  return (
    <section aria-labelledby="library-browser-title">
      {/* Status summary — a quiet ledger of the collection. */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-line/70 py-3">
        {summaryCounts.map((row) => (
          <span key={row.key} className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold text-engraving-deep">
              {row.count}
            </span>
            <span className="font-utility text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              {row.label}
            </span>
          </span>
        ))}
      </div>

      {/* Filter chips + sort control. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter by reading status"
        >
          {STATUS_FILTERS.map((key) => {
            const active = filter === key;
            const label =
              key === "all"
                ? "All"
                : READING_STATUS_LABELS[key as ReadingStatus];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  SoundManager.playClick();
                  setFilter(key);
                }}
                className={cn(
                  "btn-press border px-3 py-1.5 font-utility text-xs uppercase tracking-[0.12em] transition-colors",
                  active
                    ? "border-engraving bg-engraving text-surface"
                    : "border-line-strong bg-surface text-ink-soft hover:border-engraving hover:text-engraving-deep",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 font-utility text-xs uppercase tracking-[0.12em] text-ink-faint">
          Sort
          <select
            value={sort}
            onChange={(e) => {
              SoundManager.playToggle();
              setSort(e.target.value as SortKey);
            }}
            className="border border-line-strong bg-surface px-2 py-1.5 font-utility text-xs normal-case tracking-normal text-ink focus:border-engraving focus:outline-none"
          >
            {(
              Object.entries(SORT_LABELS) as Array<[SortKey, string]>
            ).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Catalogue grid. */}
      <div className="mt-5">
        {visible.length > 0 ? (
          <BookGrid
            books={visible}
            onOpenBook={(id) => router.push(`/library/${id}`)}
          />
        ) : (
          <p className="border border-dashed border-line-strong bg-parchment-shade/25 p-8 text-center font-display text-lg text-engraving-deep">
            No volumes match this filter.
          </p>
        )}
      </div>
    </section>
  );
}
