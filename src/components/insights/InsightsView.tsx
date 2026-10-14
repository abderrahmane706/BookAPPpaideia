"use client";

import Link from "next/link";
import { useReadingInsights } from "@/lib/services/insights/hooks";
import { useBooks } from "@/lib/services/library/hooks";
import { StatTile } from "@/components/dashboard/StatTile";
import { CategoryDistribution } from "@/components/dashboard/CategoryDistribution";
import { AddBookButton } from "@/components/books/AddBookButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextReveal } from "@/components/ui/TextReveal";
import { cn } from "@/lib/utils/cn";
import type { TimelinePoint, YearProgress } from "@/lib/services/insights";

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/**
 * InsightsView — the Reading Profile analytics page.
 *
 * Every figure is computed from persisted records (`computeInsights`). Sections
 * that need data they don't have render an explicit empty state rather than a
 * placeholder number.
 */
export function InsightsView() {
  const insights = useReadingInsights();
  const books = useBooks();

  if (!insights.hasLibrary) {
    return (
      <div className="mx-auto max-w-3xl">
        <InsightsHeader />
        <EmptyState
          title="No reading data yet"
          description="Insights are drawn entirely from the books and sessions you record. Add your first volume to begin."
          action={<AddBookButton />}
          glyph={<span className="font-display text-4xl">Π</span>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <InsightsHeader />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="In library" value={insights.overview.totalBooks} />
        <StatTile
          label="Reading"
          value={insights.overview.currentlyReading}
          hint="in progress"
          accent
        />
        <StatTile label="Completed" value={insights.overview.completed} />
        <StatTile
          label="Finished"
          value={`${insights.overview.completionRate}%`}
          hint="of the library"
        />
        <StatTile
          label="Avg rating"
          value={insights.overview.averageRating ?? "—"}
          hint={
            insights.overview.averageRating !== null
              ? "across rated books"
              : "no ratings yet"
          }
        />
      </section>

      <GoalPanel year={insights.year} />

      <section className="mt-8">
        <SectionHeading
          title="Reading activity"
          caption="Recorded from your reading sessions."
        />
        {insights.hasActivity ? (
          <div className="mt-4 grid gap-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label="Sessions"
                value={insights.activity.sessionCount}
                hint="recorded"
              />
              <Metric
                label="Time read"
                value={formatMinutes(insights.activity.totalMinutes)}
                hint="all time"
              />
              <Metric
                label="Pages"
                value={insights.activity.totalPages}
                hint={
                  insights.activity.averagePagesPerSession !== null
                    ? `~${insights.activity.averagePagesPerSession} per session`
                    : "not tracked"
                }
              />
              <Metric
                label="Current streak"
                value={insights.activity.currentStreakDays}
                hint={
                  insights.activity.longestStreakDays > 0
                    ? `longest ${insights.activity.longestStreakDays} day${insights.activity.longestStreakDays === 1 ? "" : "s"}`
                    : "days in a row"
                }
              />
            </div>
            <MonthlyTimeline points={insights.timeline} />
          </div>
        ) : (
          <p className="mt-4 border border-dashed border-line-strong bg-parchment-shade/25 p-6 text-center text-sm text-ink-soft">
            No reading sessions yet. Record a session on any book to see your
            rhythm over time.
          </p>
        )}
      </section>

      <section className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading
            title="Composition"
            caption="How your shelves and notes are built."
          />
          <div className="mt-4">
            <CategoryDistribution books={books} />
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3">
            <Metric label="Summaries" value={insights.content.summaries} />
            <Metric label="Notes" value={insights.content.notes} />
            <Metric label="Quotations" value={insights.content.quotes} />
            <Metric label="Mind maps" value={insights.content.mindMaps} />
            <Metric label="In review" value={insights.content.reviews} />
          </ul>
        </div>
        <div>
          <SectionHeading
            title="Reading states"
            caption="Where each volume currently stands."
          />
          <ul className="mt-4 grid gap-3">
            {insights.statuses.map((status) => (
              <StatusRow
                key={status.status}
                label={status.label}
                count={status.count}
                total={insights.overview.totalBooks}
              />
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function InsightsHeader() {
  return (
    <header className="mb-8 border-b border-line pb-5">
      <span className="kicker mb-2">The Reader&apos;s Ledger</span>
      <TextReveal
        as="h1"
        text="Reading Insights"
        className="heading-display font-display font-semibold text-ink"
      />
      <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-ink-soft">
        A quiet account of what you read, drawn only from the records you keep on
        this device.
      </p>
    </header>
  );
}

function SectionHeading({ title, caption }: { title: string; caption?: string }) {
  return (
    <div>
      <h2 className="font-editorial text-lg font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {caption ? (
        <p className="mt-0.5 text-xs text-ink-faint">{caption}</p>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-radius-md border border-line bg-surface px-4 py-3 shadow-card">
      <div className="font-utility text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold text-engraving-deep">
        {value}
      </div>
      {hint ? <div className="text-xs text-ink-faint">{hint}</div> : null}
    </div>
  );
}

function GoalPanel({ year }: { year: YearProgress }) {
  const pct = year.goalProgress;
  const display = pct === null ? 0 : Math.min(100, pct);

  return (
    <section className="mt-8 rounded-radius-lg border border-line bg-surface-raised/60 px-5 py-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <SectionHeading
          title={`${year.year} reading goal`}
          caption="Books finished this calendar year."
        />
        {year.annualGoal === null ? (
          <Link
            href="/profile"
            className="font-utility text-xs uppercase tracking-[0.12em] text-engraving underline underline-offset-4 hover:text-engraving-deep"
          >
            Set a goal
          </Link>
        ) : (
          <span className="font-display text-lg font-semibold text-engraving-deep">
            {year.booksCompletedThisYear}
            <span className="text-ink-faint"> / {year.annualGoal}</span>
          </span>
        )}
      </div>

      {year.annualGoal === null ? (
        <p className="mt-3 text-sm text-ink-soft">
          You have finished {year.booksCompletedThisYear}{" "}
          {year.booksCompletedThisYear === 1 ? "book" : "books"} so far this year.
          Set an annual goal to track your progress here.
        </p>
      ) : (
        <div className="mt-4">
          <div
            className="h-2 w-full bg-parchment-deep"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={display}
            aria-label={`Annual goal progress: ${pct}%`}
          >
            <div
              className={cn(
                "progress-animate h-full",
                pct !== null && pct >= 100 ? "bg-engraving" : "bg-engraving/70",
              )}
              style={{ width: `${display}%` }}
            />
          </div>
          <p className="mt-2 font-utility text-xs text-ink-faint">
            {pct}% of your goal · {Math.round(year.minutesThisYear / 60)} h read
            this year
          </p>
        </div>
      )}
    </section>
  );
}

function MonthlyTimeline({ points }: { points: TimelinePoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.minutes || p.sessions));
  const totalMinutes = points.reduce((sum, p) => sum + p.minutes, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="font-utility text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          Last twelve months
        </h3>
        <span className="font-utility text-xs text-ink-faint">
          {formatMinutes(totalMinutes)} total
        </span>
      </div>
      <ul
        className="mt-3 flex items-end gap-1.5"
        role="img"
        aria-label={`Monthly reading over the last twelve months. ${points
          .map((p) => `${p.label}: ${p.minutes} minutes`)
          .join(", ")}.`}
      >
        {points.map((point) => {
          const height =
            point.minutes > 0
              ? Math.max(6, Math.round((point.minutes / max) * 100))
              : point.sessions > 0
                ? Math.max(6, Math.round((point.sessions / max) * 100))
                : 3;
          const active = point.minutes > 0 || point.sessions > 0;
          return (
            <li key={point.month} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                title={`${point.label}: ${formatMinutes(point.minutes)}${
                  point.booksCompleted > 0
                    ? `, ${point.booksCompleted} finished`
                    : ""
                }`}
                className={cn(
                  "w-full rounded-t-[2px]",
                  active ? "bg-engraving/75" : "bg-parchment-deep",
                )}
                style={{ height: `${height}%`, minHeight: "3px" }}
              />
              <span className="font-utility text-[10px] uppercase tracking-[0.08em] text-ink-faint">
                {point.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const share = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <li className="grid gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-utility text-sm text-ink">{label}</span>
        <span className="font-utility text-xs text-ink-faint">
          {count} · {share}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-parchment-deep">
        <div
          className="progress-animate h-full bg-engraving/60"
          style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%` }}
        />
      </div>
    </li>
  );
}
