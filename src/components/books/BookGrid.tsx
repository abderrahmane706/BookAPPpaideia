import type { ReactNode } from "react";
import type { Book } from "@/lib/types/book";
import { cn } from "@/lib/utils/cn";
import { BookCard } from "./BookCard";

export interface BookGridProps {
  books: Book[];
  onOpenBook?: (bookId: string) => void;
  /** Optional per-card action rendered at each card's base. */
  renderAction?: (book: Book) => ReactNode;
  className?: string;
}

/**
 * Responsive book grid.
 *
 * Uses `repeat(auto-fit, minmax(220px, 1fr))` so every card keeps a readable
 * minimum width of ~220px and never shrinks below it — cards are never
 * compressed into a single cramped row, and never overlap. Rows wrap naturally
 * as the collection grows. A sensible max-width constrains very wide shelves.
 */
export function BookGrid({
  books,
  onOpenBook,
  renderAction,
  className,
}: BookGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5",
        className,
      )}
    >
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onOpen={onOpenBook ? () => onOpenBook(book.id) : undefined}
          action={renderAction ? renderAction(book) : undefined}
        />
      ))}
    </div>
  );
}
