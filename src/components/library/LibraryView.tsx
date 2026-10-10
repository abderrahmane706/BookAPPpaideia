"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Book, ReadingStatus } from "@/lib/types/book";
import { READING_STATUS_LABELS } from "@/lib/types/book";
import { cn } from "@/lib/utils/cn";
import {
  bookToMarkdown,
  downloadText,
  libraryToJson,
  slugifyFilename,
} from "@/lib/utils/export";
import type { BookDetail } from "@/lib/types/library";
import { library, useLibraryReady, useLibrarySnapshot } from "@/lib/services/library";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { notify } from "@/components/ui/feedback";
import { AddBookButton, BookActionsMenu, BookCard, BookFormModal } from "@/components/books";

type SortKey = "added" | "title" | "author" | "rating" | "progress";

const SORT_LABELS: Record<SortKey, string> = {
  added: "Recently added",
  title: "Title",
  author: "Author",
  rating: "Rating",
  progress: "Progress",
};

const STATUS_FILTERS: Array<ReadingStatus | "all"> = [
  "all",
  "reading",
  "want_to_read",
  "paused",
  "completed",
];

function matchesQuery(book: Book, query: string): boolean {
  if (!query) return true;
  const haystack = [book.title, book.author, book.category, book.tags.join(" ")]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function sortBooks(books: Book[], sort: SortKey): Book[] {
  const copy = [...books];
  switch (sort) {
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "author":
      return copy.sort((a, b) => a.author.localeCompare(b.author));
    case "rating":
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "progress":
      return copy.sort((a, b) => b.progress - a.progress);
    case "added":
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export function LibraryView() {
  const snapshot = useLibrarySnapshot();
  const ready = useLibraryReady();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReadingStatus | "all">("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("added");
  const [editTarget, setEditTarget] = useState<Book | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);

  const categoriesPresent = useMemo(() => {
    const set = new Set<string>();
    snapshot.books.forEach((book) => {
      if (book.category) set.add(book.category);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [snapshot.books]);

  const visibleBooks = useMemo(() => {
    const filtered = snapshot.books.filter((book) => {
      if (!matchesQuery(book, query)) return false;
      if (status !== "all" && book.status !== status) return false;
      if (category !== "all" && (book.category || "Uncategorised") !== category) {
        return false;
      }
      return true;
    });
    return sortBooks(filtered, sort);
  }, [snapshot.books, query, status, category, sort]);

  function detailFor(book: Book): BookDetail {
    return {
      book,
      summary: snapshot.summaries[book.id] ?? null,
      notes: snapshot.notes.filter((note) => note.bookId === book.id),
      quotes: snapshot.quotes.filter((quote) => quote.bookId === book.id),
      sessions: snapshot.sessions.filter((session) => session.bookId === book.id),
    };
  }

  function exportBook(book: Book) {
    downloadText(
      `${slugifyFilename(book.title)}.md`,
      bookToMarkdown(detailFor(book)),
    );
    SoundManager.playSave();
    notify(`Exported “${book.title}”.`);
  }

  function exportLibrary() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(
      `paideia-library-${stamp}.json`,
      libraryToJson(snapshot),
      "application/json",
    );
    SoundManager.playSave();
    notify("Library exported as JSON.");
  }

  function handleDelete(book: Book) {
    library.deleteBook(book.id);
    SoundManager.playDelete();
    notify(`“${book.title}” was removed from your library.`);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <span className="small-caps text-ink-faint">The Collection</span>
          <h1 className="font-display heading-chapter mt-1 text-ink">
            Your Library
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            Every volume you have gathered, with its notes, highlights and reading
            progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={exportLibrary}
            disabled={snapshot.books.length === 0}
          >
            Export library
          </Button>
          <AddBookButton />
        </div>
      </header>

      {!ready ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <li key={index}>
              <Skeleton className="h-72 w-full" />
            </li>
          ))}
        </ul>
      ) : snapshot.books.length === 0 ? (
        <EmptyState
          title="An empty library"
          description="Every great library begins with a single book. Add your first volume to begin."
          action={<AddBookButton />}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="min-w-[12rem] flex-1">
                <span className="sr-only">Search your library</span>
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by title, author or tag…"
                />
              </label>
              <label className="flex items-center gap-2 font-utility text-xs uppercase tracking-[0.12em] text-ink-faint">
                Sort
                <select
                  value={sort}
                  onChange={(event) => {
                    SoundManager.playToggle();
                    setSort(event.target.value as SortKey);
                  }}
                  className="border border-line-strong bg-surface px-2 py-2 font-utility text-xs normal-case tracking-normal text-ink focus:border-engraving focus:outline-none"
                >
                  {(Object.entries(SORT_LABELS) as Array<[SortKey, string]>).map(
                    ([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="flex items-center gap-2 font-utility text-xs uppercase tracking-[0.12em] text-ink-faint">
                Category
                <select
                  value={category}
                  onChange={(event) => {
                    SoundManager.playToggle();
                    setCategory(event.target.value);
                  }}
                  className="border border-line-strong bg-surface px-2 py-2 font-utility text-xs normal-case tracking-normal text-ink focus:border-engraving focus:outline-none"
                >
                  <option value="all">All</option>
                  {categoriesPresent.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Filter by reading status"
            >
              {STATUS_FILTERS.map((key) => {
                const active = status === key;
                const label = key === "all" ? "All" : READING_STATUS_LABELS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      SoundManager.playClick();
                      setStatus(key);
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
          </div>

          {visibleBooks.length === 0 ? (
            <p className="border border-dashed border-line-strong bg-parchment-shade/25 p-8 text-center text-sm text-ink-soft">
              No volumes match your search.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visibleBooks.map((book) => (
                <li key={book.id}>
                  <BookCard
                    book={book}
                    href={`/library/${book.id}`}
                    actions={
                      <BookActionsMenu
                        onOpen={() => router.push(`/library/${book.id}`)}
                        onEdit={() => setEditTarget(book)}
                        onExport={() => exportBook(book)}
                        onDelete={() => setDeleteTarget(book)}
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <BookFormModal
        key={editTarget?.id ?? "edit-closed"}
        open={Boolean(editTarget)}
        book={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove this book?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” and all of its notes, highlights and reading sessions will be permanently deleted from this device.`
            : undefined
        }
        confirmLabel="Delete book"
        destructive
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
