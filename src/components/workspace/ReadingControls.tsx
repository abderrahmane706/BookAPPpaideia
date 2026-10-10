"use client";

import type { Book, ReadingProgress, ReadingStatus } from "@/lib/types/book";
import { READING_STATUSES, READING_STATUS_LABELS } from "@/lib/types/book";
import { cn } from "@/lib/utils/cn";
import { library } from "@/lib/services/library";
import { SoundManager } from "@/lib/services/sound/SoundManager";

const MILESTONES: ReadingProgress[] = [0, 25, 50, 75, 100];

const MILESTONE_LABEL: Record<ReadingProgress, string> = {
  0: "0%",
  25: "25%",
  50: "50%",
  75: "75%",
  100: "100%",
};

/** Status, milestone progress, and optional exact page tracking. */
export function ReadingControls({ book }: { book: Book }) {
  return (
    <div className="grid gap-4 rounded-radius-md border border-line bg-surface p-4">
      <div>
        <span className="font-utility text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          Status
        </span>
        <div
          className="mt-2 flex flex-wrap gap-1.5"
          role="group"
          aria-label="Reading status"
        >
          {READING_STATUSES.map((status: ReadingStatus) => {
            const active = book.status === status;
            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  library.setStatus(book.id, status);
                  SoundManager.playToggle();
                }}
                className={cn(
                  "btn-press border px-3 py-1.5 font-utility text-xs transition-colors",
                  active
                    ? "border-engraving bg-engraving text-surface"
                    : "border-line-strong bg-surface text-ink-soft hover:border-engraving hover:text-engraving-deep",
                )}
              >
                {READING_STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="font-utility text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          Progress
        </span>
        <div
          className="mt-2 flex flex-wrap gap-1.5"
          role="group"
          aria-label="Reading progress"
        >
          {MILESTONES.map((milestone) => {
            const active = book.progress === milestone;
            const disabled = book.status === "want_to_read" && milestone !== 0;
            return (
              <button
                key={milestone}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => {
                  library.setProgress(book.id, milestone);
                  SoundManager.playToggle();
                }}
                className={cn(
                  "btn-press border px-3 py-1.5 font-utility text-xs transition-colors",
                  "disabled:pointer-events-none disabled:opacity-40",
                  active
                    ? "border-gold bg-gold/15 text-engraving-deep"
                    : "border-line-strong bg-surface text-ink-soft hover:border-gold hover:text-engraving-deep",
                )}
              >
                {MILESTONE_LABEL[milestone]}
              </button>
            );
          })}
        </div>
      </div>

      {book.pageCount ? (
        <div className="grid gap-1.5">
          <label
            htmlFor="current-page"
            className="font-utility text-[11px] uppercase tracking-[0.16em] text-ink-faint"
          >
            Current page
          </label>
          <div className="flex items-center gap-2">
            <input
              id="current-page"
              key={book.currentPage ?? "none"}
              type="number"
              min={0}
              max={book.pageCount}
              inputMode="numeric"
              defaultValue={book.currentPage ?? ""}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  (event.target as HTMLInputElement).blur();
                }
              }}
              onBlur={(event) => {
                const raw = event.target.value;
                const next = raw === "" ? null : Number(raw);
                if (next !== book.currentPage) {
                  library.setCurrentPage(book.id, next);
                  SoundManager.playSave();
                }
              }}
              className="w-28 rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-engraving focus:outline-none"
            />
            <span className="font-utility text-sm text-ink-faint">
              of {book.pageCount} pages
            </span>
          </div>
        </div>
      ) : null}

      <dl className="grid gap-1 text-xs text-ink-faint">
        {book.startedAt ? (
          <div className="flex gap-2">
            <dt className="font-utility uppercase tracking-[0.12em]">Started</dt>
            <dd>{book.startedAt.slice(0, 10)}</dd>
          </div>
        ) : null}
        {book.completedAt ? (
          <div className="flex gap-2">
            <dt className="font-utility uppercase tracking-[0.14em]">Finished</dt>
            <dd>{book.completedAt.slice(0, 10)}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
