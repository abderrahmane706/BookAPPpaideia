"use client";

import Link from "next/link";
import { useBookDetail, useLibraryReady } from "@/lib/services/library";
import { WorkspaceSection } from "./Section";
import { SectionNav } from "./SectionNav";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { OverviewPanel } from "./OverviewPanel";
import { SummaryEditor } from "./SummaryEditor";
import { NotesPanel } from "./NotesPanel";
import { QuotesPanel } from "./QuotesPanel";
import { ReviewPanel } from "./ReviewPanel";
import { ActivityPanel } from "./ActivityPanel";
import { MindMapPanel } from "@/components/mind-map";

const SECTIONS = [
  { id: "overview", index: "01", label: "Overview" },
  { id: "summary", index: "02", label: "Summary" },
  { id: "notes", index: "03", label: "Notes" },
  { id: "quotes", index: "04", label: "Highlights" },
  { id: "review", index: "05", label: "Review" },
  { id: "mindmap", index: "06", label: "Mind Map" },
  { id: "activity", index: "07", label: "Activity" },
];

export interface BookWorkspaceProps {
  bookId: string;
}

/** Full reading workspace for a single volume. */
export function BookWorkspace({ bookId }: BookWorkspaceProps) {
  const ready = useLibraryReady();
  const detail = useBookDetail(bookId);

  if (!ready) {
    return (
      <div className="mx-auto grid max-w-4xl gap-6 py-8">
        <span className="sr-only">Loading book…</span>
        <div className="grid gap-6 sm:grid-cols-[9rem_1fr]">
          <div className="aspect-[2/3] w-32 rounded-radius-sm bg-ink/5" />
          <div className="grid gap-3">
            <div className="h-8 w-2/3 rounded-radius-sm bg-ink/5" />
            <div className="h-4 w-1/3 rounded-radius-sm bg-ink/5" />
            <div className="h-6 w-1/4 rounded-radius-sm bg-ink/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="font-display heading-chapter text-ink">Book not found</h1>
        <p className="mt-3 text-sm text-ink-soft">
          This volume is not in your library. It may have been removed.
        </p>
        <Link
          href="/library"
          className="mt-6 inline-block font-utility text-sm text-engraving-deep underline decoration-line-strong underline-offset-4"
        >
          ← Back to your library
        </Link>
      </div>
    );
  }

  const { book, summary, notes, quotes, sessions } = detail;

  return (
    <div className="mx-auto max-w-4xl">
      <WorkspaceHeader detail={detail} />

      <SectionNav items={SECTIONS} />

      <div className="mt-10 grid gap-12">
        <WorkspaceSection
          id="overview"
          index="01"
          title="Overview"
          description="Your record of the volume and where you stand in it."
        >
          <OverviewPanel detail={detail} />
        </WorkspaceSection>

        <WorkspaceSection
          id="summary"
          index="02"
          title="Summary"
          description="Your own digest of the book, in your own words."
        >
          <SummaryEditor
            key={book.id}
            bookId={book.id}
            initialContent={summary?.content ?? null}
            initialUpdatedAt={summary?.updatedAt ?? null}
          />
        </WorkspaceSection>

        <WorkspaceSection
          id="notes"
          index="03"
          title="Notes"
          description="Thoughts captured as you read."
        >
          <NotesPanel bookId={book.id} notes={notes} />
        </WorkspaceSection>

        <WorkspaceSection
          id="quotes"
          index="04"
          title="Quotations & Highlights"
          description="Passages worth preserving, with your annotations."
        >
          <QuotesPanel bookId={book.id} quotes={quotes} />
        </WorkspaceSection>

        <WorkspaceSection
          id="review"
          index="05"
          title="Personal Review"
          description="What the book meant to you, and what you will carry forward."
        >
          <ReviewPanel key={book.id} book={book} />
        </WorkspaceSection>

        <WorkspaceSection
          id="mindmap"
          index="06"
          title="Mind Map"
          description="Sketch the book's ideas as nodes you can arrange, connect and refine."
        >
          <MindMapPanel bookId={book.id} />
        </WorkspaceSection>

        <WorkspaceSection
          id="activity"
          index="07"
          title="Reading Activity"
          description="A quiet ledger of the time you have spent with this book."
        >
          <ActivityPanel
            bookId={book.id}
            sessions={sessions}
            pageCount={book.pageCount}
          />
        </WorkspaceSection>
      </div>
    </div>
  );
}
