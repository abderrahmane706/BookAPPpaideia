import type { Book } from "@/lib/types/book";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddBookButton } from "@/components/books/AddBookButton";
import { LibraryBrowser } from "./LibraryBrowser";

export interface LibrarySectionProps {
  books: Book[];
}

/** The full library collection with filter/sort, or a guided empty state. */
export function LibrarySection({ books }: LibrarySectionProps) {
  return (
    <section aria-labelledby="library-title">
      <SectionHeader
        eyebrow="Collection"
        title="Your library"
        description={
          books.length > 0
            ? `${books.length} ${books.length === 1 ? "volume" : "volumes"} on your shelves.`
            : "Begin with a single volume."
        }
      />

      {books.length > 0 ? (
        <div className="mt-5">
          <LibraryBrowser books={books} />
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="An empty library"
            description="Every great library begins with a single book. Add your first volume to start your collection."
            action={<AddBookButton />}
          />
        </div>
      )}
    </section>
  );
}
