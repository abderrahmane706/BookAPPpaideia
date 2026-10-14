"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Book } from "@/lib/types/book";
import {
  REVIEW_FEEDBACKS,
  REVIEW_FEEDBACK_LABELS,
  type ReviewFeedback,
  type ReviewItem,
} from "@/lib/types/review";
import { reviewSourceHref, sourceLabel } from "@/lib/services/review";
import { library } from "@/lib/services/library";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { GreekOrnament } from "@/components/ui/GreekOrnament";

/** Short, honest description of what each answer does to the schedule. */
const FEEDBACK_HINT: Record<ReviewFeedback, string> = {
  again: "Relearn — appears again today",
  difficult: "A short interval",
  good: "A comfortable interval",
  easy: "A longer interval",
};

const FEEDBACK_VARIANT: Record<
  ReviewFeedback,
  "primary" | "secondary" | "ghost" | "danger"
> = {
  again: "danger",
  difficult: "ghost",
  good: "secondary",
  easy: "primary",
};

export interface ReviewSessionProps {
  /** The queue captured when the session began (fixed for the session). */
  items: ReviewItem[];
  booksById: Map<string, Book>;
  onExit: () => void;
}

/**
 * ReviewSession — the reader works through their due items one at a time:
 * recall the prompt, reveal the saved material, then say how it felt. Each
 * answer reschedules the item immediately, so nothing is lost if the reader
 * leaves part-way. The queue is captured up front and never reshuffles
 * mid-session.
 */
export function ReviewSession({ items, booksById, onExit }: ReviewSessionProps) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState<Record<string, ReviewFeedback>>({});
  const [started] = useState(() => items.length);

  const total = items.length;
  const current = items[index] ?? null;
  const complete = total > 0 && index >= total;

  const book = current ? booksById.get(current.bookId) ?? null : null;

  const counts = useMemo(() => {
    const tally: Record<ReviewFeedback, number> = {
      again: 0,
      difficult: 0,
      good: 0,
      easy: 0,
    };
    for (const value of Object.values(ratings)) tally[value] += 1;
    return tally;
  }, [ratings]);

  function reveal(): void {
    setRevealed(true);
    SoundManager.playClick();
  }

  function rate(feedback: ReviewFeedback): void {
    if (!current) return;
    library.applyReviewFeedback(current.id, feedback);
    setRatings((prev) => ({ ...prev, [current.id]: feedback }));
    if (feedback === "again") SoundManager.playToggle();
    else SoundManager.playSave();
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (total === 0) {
    return (
      <div className="rounded-radius-lg border border-line bg-surface px-6 py-12 text-center">
        <p className="font-editorial text-lg text-ink">
          There is nothing due to review just now.
        </p>
        <Button variant="secondary" className="mt-5" onClick={onExit}>
          Return to the Agora
        </Button>
      </div>
    );
  }

  if (complete) {
    const revisited = counts.again;
    return (
      <div className="rounded-radius-lg border border-line bg-surface px-6 py-10 text-center sm:px-10">
        <GreekOrnament shape="laurel" className="mx-auto mb-4 h-8 w-8 text-gold" />
        <span className="kicker">Session complete</span>
        <h2 className="mt-2 font-editorial text-2xl font-semibold tracking-tight text-ink">
          You reviewed {total} {total === 1 ? "item" : "items"} today.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          {revisited > 0
            ? `${revisited} ${
                revisited === 1 ? "idea" : "ideas"
              } will return today, while the rest have been spaced further out.`
            : "Everything felt solid, so your queue has been spaced further out."}
        </p>

        <dl className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-radius-md border border-line bg-line sm:grid-cols-4">
          {REVIEW_FEEDBACKS.map((feedback) => (
            <div key={feedback} className="bg-surface px-3 py-4">
              <dt className="small-caps text-ink-faint">
                {REVIEW_FEEDBACK_LABELS[feedback]}
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold text-engraving">
                {counts[feedback]}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mx-auto mt-6 max-w-md text-xs leading-relaxed text-ink-faint">
          This is a simple, transparent interval model for revisiting your own
          reading — not a prediction of memory.
        </p>

        <div className="mt-7 flex justify-center gap-2">
          <Button onClick={onExit}>Return to the Agora</Button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const progress = Math.round((index / total) * 100);

  return (
    <section
      aria-label="Review session"
      className="rounded-radius-lg border border-line bg-surface shadow-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="small-caps text-ink-faint">
            {index + 1} of {started}
          </span>
          <span className="rounded-radius-sm border border-line-strong px-2 py-0.5 font-utility text-[0.65rem] uppercase tracking-[0.12em] text-engraving">
            {sourceLabel(current)}
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="font-utility text-xs uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-engraving-deep"
        >
          End session
        </button>
      </header>

      <div className="px-6 pt-5">
        <Progress value={progress} label="Session progress" />
      </div>

      <div className="px-6 py-8 sm:px-10 sm:py-10">
        {book ? (
          <Link
            href={reviewSourceHref(current)}
            className="font-utility text-xs uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-engraving-deep"
          >
            {book.title}
            {book.author ? ` · ${book.author}` : ""}
          </Link>
        ) : null}

        <p className="mt-4 font-editorial text-xl leading-relaxed text-ink sm:text-2xl">
          {current.prompt}
        </p>

        <div className="mt-7">
          {revealed ? (
            <div className="rounded-radius-md border border-line bg-parchment-shade/40 px-5 py-5">
              <span className="small-caps text-ink-faint">
                Your saved material
              </span>
              <p className="mt-2 whitespace-pre-wrap font-body text-[0.95rem] leading-relaxed text-ink">
                {current.answer}
              </p>
            </div>
          ) : (
            <Button variant="secondary" onClick={reveal}>
              Reveal the material
            </Button>
          )}
        </div>
      </div>

      {revealed ? (
        <footer className="border-t border-line px-6 py-5 sm:px-10">
          <p className="small-caps mb-3 text-ink-faint">How did that recall feel?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {REVIEW_FEEDBACKS.map((feedback) => (
              <div key={feedback} className="flex flex-col gap-1.5">
                <Button
                  variant={FEEDBACK_VARIANT[feedback]}
                  size="sm"
                  onClick={() => rate(feedback)}
                >
                  {REVIEW_FEEDBACK_LABELS[feedback]}
                </Button>
                <span className="px-1 font-utility text-[0.65rem] leading-snug text-ink-faint">
                  {FEEDBACK_HINT[feedback]}
                </span>
              </div>
            ))}
          </div>
        </footer>
      ) : null}
    </section>
  );
}
