"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ReviewItem } from "@/lib/types/review";
import { promptOfTheDay } from "@/lib/services/review";
import {
  useBooks,
  useDueReviews,
  useLibraryReady,
  useReviews,
} from "@/lib/services/library";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { TextReveal } from "@/components/ui/TextReveal";
import { GreekOrnament } from "@/components/ui/GreekOrnament";
import { GreekMeanderRule } from "@/components/ui/GreekMeanderRule";
import { GreekRule } from "@/components/ui/GreekRule";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ReviewSession } from "./ReviewSession";
import { ReviewQueueList } from "./ReviewQueueList";
import { AddReviewForm } from "./AddReviewForm";

function startOfTodayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * AgoraView — the daily recall workspace.
 *
 * An editorial room rather than a metrics dashboard: today's reflection, the
 * due queue, and the reader's own shelf of review items. All content is the
 * reader's own notes, quotations and reflections; the schedule only decides
 * what is worth revisiting.
 */
export function AgoraView() {
  const isClient = useIsClient();
  const ready = useLibraryReady();
  const books = useBooks();
  const reviews = useReviews();
  const due = useDueReviews();

  const [sessionItems, setSessionItems] = useState<ReviewItem[] | null>(null);

  const booksById = useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books],
  );

  const completedToday = useMemo(() => {
    if (!isClient) return 0;
    const today = startOfTodayKey(new Date());
    return reviews.filter(
      (item) =>
        item.lastReviewedAt &&
        startOfTodayKey(new Date(item.lastReviewedAt)) === today,
    ).length;
  }, [reviews, isClient]);

  const hydrated = isClient && ready;
  const prompt = isClient ? promptOfTheDay() : "";

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <span className="kicker mb-2">The Agora</span>
        <TextReveal
          as="h1"
          text="Agora"
          className="heading-display font-display font-semibold text-ink"
        />
        <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-ink-soft">
          A place to gather and reflect on what you have read. The Agora
          resurfaces your own notes, quotations and reflections at widening
          intervals — a practice of remembering, not a score to beat.
        </p>
        <GreekMeanderRule density="section" className="mt-6" />
      </header>

      {sessionItems ? (
        <ReviewSession
          items={sessionItems}
          booksById={booksById}
          onExit={() => setSessionItems(null)}
        />
      ) : (
        <>
          {/* ----- Today's reflection ----- */}
          <section className="relative overflow-hidden rounded-radius-lg border border-line bg-surface px-6 py-7 shadow-card sm:px-8">
            <GreekOrnament
              shape="diamond"
              className="absolute right-6 top-6 hidden text-gold/60 sm:block"
            />
            <span className="small-caps text-ink-faint">
              Reflection of the day
            </span>
            <p className="mt-3 max-w-2xl font-editorial text-lg leading-relaxed text-ink sm:text-xl">
              {prompt || "\u00A0"}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
              <div>
                <span className="font-display text-3xl font-semibold text-engraving">
                  {hydrated ? due.length : "—"}
                </span>
                <span className="ml-2 font-utility text-xs uppercase tracking-[0.12em] text-ink-faint">
                  due today
                </span>
              </div>
              <div>
                <span className="font-display text-3xl font-semibold text-ink-soft">
                  {hydrated ? completedToday : "—"}
                </span>
                <span className="ml-2 font-utility text-xs uppercase tracking-[0.12em] text-ink-faint">
                  reviewed today
                </span>
              </div>
              <div>
                <span className="font-display text-3xl font-semibold text-ink-soft">
                  {hydrated ? reviews.length : "—"}
                </span>
                <span className="ml-2 font-utility text-xs uppercase tracking-[0.12em] text-ink-faint">
                  in the queue
                </span>
              </div>

              <div className="ml-auto flex gap-2">
                {hydrated && due.length > 0 ? (
                  <Button onClick={() => setSessionItems(due)}>
                    Begin review
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

          {/* ----- Body ----- */}
          <div className="mt-10">
            {!hydrated ? (
              <div className="h-40 animate-pulse rounded-radius-lg border border-dashed border-line bg-parchment-shade/30" />
            ) : reviews.length === 0 ? (
              <EmptyState
                glyph={<GreekOrnament shape="laurel" className="h-8 w-8" />}
                title="Your review queue is empty"
                description={
                  books.length === 0
                    ? "Add a book, then queue a note, quotation or reflection to begin your practice of recall."
                    : "Open a book and choose “Add to review” on a note, a quotation, or a reflection — or add one by hand below."
                }
                action={
                  books.length === 0 ? (
                    <Link
                      href="/library"
                      className="inline-flex h-10 items-center rounded-radius-sm bg-engraving px-5 font-utility text-sm font-medium text-surface transition-colors hover:bg-engraving-deep"
                    >
                      Go to your library
                    </Link>
                  ) : (
                    <AddReviewForm books={books} />
                  )
                }
              />
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="font-editorial text-xl font-semibold tracking-tight text-ink">
                      Your queue
                    </h2>
                    <p className="mt-1 font-body text-sm text-ink-soft">
                      Everything you have set aside to remember.
                    </p>
                  </div>
                  <AddReviewForm books={books} />
                </div>
                <ReviewQueueList items={reviews} booksById={booksById} />
              </>
            )}
          </div>

          <GreekRule className="my-10" />

          {/* ----- Assistant ----- */}
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-radius-lg border border-line bg-parchment-shade/40 px-6 py-6">
            <div>
              <span className="small-caps text-ink-faint">PAIDEIA</span>
              <h2 className="mt-1 font-editorial text-lg font-semibold tracking-tight text-ink">
                Ask about what you have read
              </h2>
              <p className="mt-1 max-w-lg font-body text-sm text-ink-soft">
                A book-focused assistant grounded in your library. It can
                compare your notes, recall a summary, and suggest what to
                revisit next.
              </p>
            </div>
            <Link
              href="/agora/assistant"
              className="inline-flex h-10 items-center rounded-radius-sm border border-line-strong bg-surface px-5 font-utility text-sm font-medium text-ink transition-colors hover:border-engraving hover:text-engraving-deep"
            >
              Open the assistant
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
