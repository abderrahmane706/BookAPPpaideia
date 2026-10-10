"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { Book } from "@/lib/types/book";
import { READING_STATUS_LABELS } from "@/lib/types/book";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { BookCover } from "./BookCover";
import { StarRatingComponent } from "./StarRating";

const statusTone: Record<Book["status"], "engraving" | "gold" | "muted" | "success"> = {
  want_to_read: "muted",
  reading: "engraving",
  paused: "gold",
  completed: "success",
};

/** Human label for the current reading milestone. */
function milestoneLabel(progress: Book["progress"]): string {
  if (progress >= 100) return "Finished";
  if (progress >= 75) return "Three-quarters";
  if (progress >= 50) return "Halfway";
  if (progress >= 25) return "A quarter in";
  return "Just began";
}

export interface BookCardProps {
  book: Book;
  /** When set, the card body links to the book workspace. */
  href?: string;
  /** Legacy click handler for the card body (e.g. dashboard). */
  onOpen?: (bookId: string) => void;
  /** Top-right contextual menu (edit / delete / export). */
  actions?: ReactNode;
  /** Optional action rendered at the card's base under a divider. */
  action?: ReactNode;
  className?: string;
}

/** A single volume card: cover, title, status, rating and progress. */
export function BookCard({
  book,
  href,
  onOpen,
  actions,
  action,
  className,
}: BookCardProps) {
  const body = (
    <>
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <BookCover title={book.title} src={book.coverUrl} />
        <div className="absolute left-2 top-2">
          <Badge tone={statusTone[book.status]}>
            {READING_STATUS_LABELS[book.status]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug text-ink">
          {book.title}
        </h3>
        <p className="truncate font-utility text-xs uppercase tracking-[0.12em] text-ink-soft">
          {book.author}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-2 pt-1">
          <Badge tone="muted" className="min-w-0">
            {book.category || "Uncategorised"}
          </Badge>
          <StarRatingComponent rating={book.rating} />
        </div>

        <div className="mt-1">
          <Progress value={book.progress} label={`${book.progress}% read`} />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-utility text-[11px] text-ink-soft">
              {milestoneLabel(book.progress)}
            </span>
            <span className="font-utility text-[11px] font-semibold text-engraving-deep">
              {book.progress}%
            </span>
          </div>
        </div>
      </div>
    </>
  );

  const bodyClassName =
    "flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving";

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-radius-lg border border-line bg-surface shadow-card transition-shadow hover:shadow-card-hover",
        className,
      )}
    >
      {actions ? (
        <div className="absolute right-2 top-2 z-10">{actions}</div>
      ) : null}

      {href ? (
        <Link href={href} className={cn(bodyClassName, "text-left")}>
          {body}
        </Link>
      ) : onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(book.id)}
          className={cn(bodyClassName, "text-left")}
        >
          {body}
        </button>
      ) : (
        <div className={bodyClassName}>{body}</div>
      )}

      {action ? (
        <div className="border-t border-line/70 px-3.5 pb-3.5 pt-2.5">{action}</div>
      ) : null}
    </article>
  );
}
