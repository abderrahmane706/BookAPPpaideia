"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BookDetail } from "@/lib/types/library";
import { READING_STATUS_LABELS } from "@/lib/types/book";
import { library } from "@/lib/services/library";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { bookToMarkdown, downloadText, slugifyFilename } from "@/lib/utils/export";
import { notify } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import {
  BookActionsMenu,
  BookCover,
  BookFormModal,
  StarRatingComponent,
} from "@/components/books";

export interface WorkspaceHeaderProps {
  detail: BookDetail;
}

/** Workspace masthead: identity, meta, and per-book actions. */
export function WorkspaceHeader({ detail }: WorkspaceHeaderProps) {
  const { book } = detail;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function exportBook() {
    downloadText(
      `${slugifyFilename(book.title)}.md`,
      bookToMarkdown(detail),
    );
    SoundManager.playSave();
    notify(`Exported “${book.title}”.`);
  }

  function handleDelete() {
    library.deleteBook(book.id);
    SoundManager.playDelete();
    notify(`“${book.title}” was removed from your library.`);
    router.push("/library");
  }

  return (
    <header className="grid gap-6 border-b border-line pb-8 sm:grid-cols-[9rem_1fr]">
      <div className="aspect-[2/3] w-32 overflow-hidden rounded-radius-sm border border-line bg-parchment-shade/30 sm:w-36">
        <BookCover title={book.title} src={book.coverUrl} />
      </div>

      <div className="flex flex-col justify-between gap-4">
        <div>
          <Link
            href="/library"
            className="font-utility text-xs uppercase tracking-[0.16em] text-ink-faint transition-colors hover:text-engraving-deep"
          >
            ← Library
          </Link>
          <h1 className="font-display heading-display mt-2 text-ink">
            {book.title}
          </h1>
          <p className="mt-1 font-body text-lg italic text-ink-soft">
            {book.author}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge>{READING_STATUS_LABELS[book.status]}</Badge>
            {book.category ? <Badge tone="muted">{book.category}</Badge> : null}
            <StarRatingComponent rating={book.rating} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn-press rounded-radius-sm border border-line-strong bg-surface px-4 py-2 font-utility text-sm text-ink transition-colors hover:border-engraving hover:text-engraving-deep"
          >
            Edit details
          </button>
          <BookActionsMenu
            onExport={exportBook}
            onDelete={() => setConfirmDelete(true)}
            label="More actions"
          />
        </div>
      </div>

      <BookFormModal
        key={`${book.id}-${editing ? "edit-open" : "edit-closed"}`}
        open={editing}
        book={book}
        onClose={() => setEditing(false)}
        onSaved={() => notify("Book updated.")}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this book?"
        description={`“${book.title}” and all of its summary, notes, quotations and reading sessions will be permanently removed.`}
        confirmLabel="Delete book"
        destructive
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </header>
  );
}
