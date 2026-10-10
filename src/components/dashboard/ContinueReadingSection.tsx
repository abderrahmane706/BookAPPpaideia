"use client";

import { useRouter } from "next/navigation";
import type { Book } from "@/lib/types/book";
import { BookGrid } from "@/components/books/BookGrid";
import { AddBookButton } from "@/components/books/AddBookButton";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SoundManager } from "@/lib/services/sound/SoundManager";

export interface ContinueReadingSectionProps {
  /** Only books whose reading status is "reading". */
  reading: Book[];
}

/**
 * Chapter II — Continue Reading.
 *
 * Displays ONLY the books currently being read, in a balanced responsive grid.
 * Each card opens the book's workspace (summary, notes, quotations, review).
 * A refined empty state guides the reader when nothing is in progress.
 */
export function ContinueReadingSection({
  reading,
}: ContinueReadingSectionProps) {
  const router = useRouter();

  if (reading.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 border border-dashed border-line-strong bg-parchment-shade/25 p-8">
        <p className="font-display text-xl font-semibold text-engraving-deep">
          None in progress, just now.
        </p>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          The books you are reading will gather here. Begin a new chapter by
          adding a volume to your collection.
        </p>
        <AddBookButton />
      </div>
    );
  }

  return (
    <div className="w-full">
      <SectionHeader
        eyebrow="Continue"
        title="Open your desk"
        description={`${reading.length} ${reading.length === 1 ? "volume" : "volumes"} currently in progress.`}
      />
      <div className="mt-5">
        <BookGrid
          books={reading}
          onOpenBook={(id) => router.push(`/library/${id}`)}
          renderAction={(book) => (
            <Button
              size="xs"
              variant="secondary"
              className="w-full"
              onClick={() => {
                SoundManager.playOpen();
                router.push(`/library/${book.id}`);
              }}
            >
              Continue →
            </Button>
          )}
        />
      </div>
    </div>
  );
}
