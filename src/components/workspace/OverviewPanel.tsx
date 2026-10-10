"use client";

import type { BookDetail } from "@/lib/types/library";
import { ReadingControls } from "./ReadingControls";

function MetaRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-t border-line py-2.5 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="font-utility text-[11px] uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </dt>
      <dd className="text-sm text-ink sm:text-right">{value}</dd>
    </div>
  );
}

export interface OverviewPanelProps {
  detail: BookDetail;
}

/** Overview: bibliographic detail, reading controls, and reader tags. */
export function OverviewPanel({ detail }: OverviewPanelProps) {
  const { book } = detail;

  const meta: Array<{ label: string; value: string | null }> = [
    { label: "Category", value: book.category || null },
    { label: "Publisher", value: book.publisher },
    { label: "Published", value: book.publishedYear ? String(book.publishedYear) : null },
    { label: "Pages", value: book.pageCount ? String(book.pageCount) : null },
    { label: "Language", value: book.language },
    { label: "ISBN", value: book.isbn },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid gap-6">
        {book.description ? (
          <p className="max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
            {book.description}
          </p>
        ) : (
          <p className="text-sm italic text-ink-faint">
            No description yet. Edit the book to add one.
          </p>
        )}

        <dl className="mt-1">
          {meta.map((row) => (
            <MetaRow key={row.label} label={row.label} value={row.value} />
          ))}
        </dl>

        {book.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {book.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-radius-sm border border-line-strong bg-parchment-shade/30 px-2.5 py-1 font-utility text-xs text-ink-soft"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <ReadingControls book={book} />
    </div>
  );
}
