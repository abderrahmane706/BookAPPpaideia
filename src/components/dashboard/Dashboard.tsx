"use client";

import { useMemo } from "react";
import { computeDashboardStats, partitionLibrary } from "@/lib/utils/library";
import { LIBRARY_QUOTES } from "@/lib/constants";
import { useBooks } from "@/lib/services/library";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { AppShell } from "@/components/layout/AppShell";
import {
  ActiveChapterProvider,
  ChapterNavigation,
  ScrollChapter,
} from "@/components/chapters";
import { QuoteBlock } from "@/components/ui/QuoteBlock";
import { GreekMeander } from "@/components/ui/GreekMeander";
import { AddBookButton } from "@/components/books/AddBookButton";
import { ContinueReadingSection } from "./ContinueReadingSection";
import { LibrarySection } from "./LibrarySection";
import { ReadingStats } from "./ReadingStats";
import { CategoryDistribution } from "./CategoryDistribution";
import { ReflectionSection } from "./ReflectionSection";

const WELCOME_ARTWORK = "/images/paideia/chapters/welcome.png";
const CONTINUE_READING_ARTWORK =
  "/images/paideia/chapters/continue-reading.png";

const CHAPTERS = [
  { index: "01", label: "Welcome", id: "chapter-welcome" },
  { index: "02", label: "Continue Reading", id: "chapter-reading" },
  { index: "03", label: "Your Library", id: "chapter-library" },
  { index: "04", label: "Reading Insights", id: "chapter-insights" },
  { index: "05", label: "Reflection", id: "chapter-reflection" },
];

/**
 * Dashboard — the five-chapter home surface.
 *
 * Reads the reader's library from the client store (local-first), so stats and
 * shelves stay in sync with every add / edit / delete without a server round
 * trip. The deterministic welcome quote is chosen on the client only, to avoid
 * a hydration mismatch across time zones.
 */
export function Dashboard() {
  const books = useBooks();
  const isClient = useIsClient();

  const stats = useMemo(() => computeDashboardStats(books), [books]);
  const { reading } = useMemo(() => partitionLibrary(books), [books]);
  const quote = isClient
    ? LIBRARY_QUOTES[new Date().getDate() % LIBRARY_QUOTES.length]
    : null;

  return (
    <ActiveChapterProvider chapters={CHAPTERS}>
      <AppShell>
        <h1 className="sr-only">Paideia — A Reader&apos;s Library</h1>
        <div className="mb-8 flex items-center justify-between gap-3 border-b border-line pb-4">
          <span className="flex items-center gap-3">
            <span aria-hidden className="flourish">
              a
            </span>
            <span className="small-caps text-ink-faint">
              PAIDEIA · The Reader&apos;s Library
            </span>
            <span aria-hidden className="flourish">
              b
            </span>
          </span>
          <ChapterNavigation />
        </div>

        {/* CHAPTER I — WELCOME */}
        <ScrollChapter
          id="chapter-welcome"
          index="01"
          numeral="I"
          label="Welcome"
          title="Welcome back to your library."
          titleClassName="heading-display"
          artwork={{ src: WELCOME_ARTWORK, position: "right", size: 0.62 }}
        >
          <div className="max-w-xl">
            {quote ? <QuoteBlock text={quote.text} source={quote.source} /> : null}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <AddBookButton />
              <span className="font-utility text-xs uppercase tracking-[0.18em] text-ink-faint">
                A new chapter awaits
              </span>
            </div>
          </div>
        </ScrollChapter>

        {/* CHAPTER II — CONTINUE READING */}
        <ScrollChapter
          id="chapter-reading"
          index="02"
          numeral="II"
          label="Continue Reading"
          title="Continue reading"
          description="Pick up where you paused."
          titleClassName="heading-chapter"
          artwork={{
            src: CONTINUE_READING_ARTWORK,
            position: "right",
            size: 0.6,
          }}
          footer={<ContinueReadingSection reading={reading} />}
        >
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            The volumes you are presently reading rest below — resume where your
            last chapter left off.
          </p>
        </ScrollChapter>

        {/* CHAPTER III — YOUR LIBRARY */}
        <ScrollChapter
          id="chapter-library"
          index="03"
          numeral="III"
          label="Your Library"
          title="Your Library"
          description="All your books, notes and highlights."
          footer={<LibrarySection books={books} />}
        >
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            A catalogue of the volumes you have gathered and annotated.
          </p>
        </ScrollChapter>

        {/* CHAPTER IV — READING INSIGHTS */}
        <ScrollChapter
          id="chapter-insights"
          index="04"
          numeral="IV"
          label="Reading Insights"
          title="Reading Insights"
          description="Discover your reading patterns."
          footer={
            <div className="grid gap-8">
              <ReadingStats stats={stats} />
              <CategoryDistribution books={books} />
            </div>
          }
        >
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            The silent rhythms of how you read, laid out like a scholar&apos;s
            ledger.
          </p>
        </ScrollChapter>

        {/* CHAPTER V — REFLECTION */}
        <ScrollChapter
          id="chapter-reflection"
          index="05"
          numeral="V"
          label="Reflection"
          title="Reflection"
          description="Thoughts, notes and deeper understanding."
          footer={<ReflectionSection />}
        >
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            Set down what these pages call up in you.
          </p>
        </ScrollChapter>

        {/* Closing meander — a Greek key border closing the volume. */}
        <GreekMeander className="mt-14 max-w-md" />
      </AppShell>
    </ActiveChapterProvider>
  );
}
