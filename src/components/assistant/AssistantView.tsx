"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { AssistantScope } from "@/services/ai/context";
import { TextReveal } from "@/components/ui/TextReveal";
import { GreekMeanderRule } from "@/components/ui/GreekMeanderRule";
import { AssistantPanel } from "./AssistantPanel";

export interface AssistantViewProps {
  /** When present, the assistant opens scoped to this book. */
  bookId?: string;
}

/**
 * AssistantView — the dedicated PAIDEIA assistant workspace at /agora/assistant.
 * It shares the single conversation model with the compact in-book panel.
 */
export function AssistantView({ bookId }: AssistantViewProps) {
  const scope: AssistantScope = useMemo(
    () => (bookId ? { kind: "book", bookId } : { kind: "library" }),
    [bookId],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <span className="kicker mb-2">PAIDEIA · The Reader&apos;s Assistant</span>
        <TextReveal
          as="h1"
          text="Ask about your reading"
          className="heading-display font-display font-semibold text-ink"
        />
        <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-ink-soft">
          The assistant can read everything you have saved — summaries, notes,
          quotations and reflections — and nothing else. It cannot invent
          quotations, and every claim it makes about your material is linked
          back to its source.
        </p>
        <GreekMeanderRule density="section" className="mt-6" />
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="rounded-radius-sm border border-line-strong px-3 py-1 font-utility text-xs uppercase tracking-[0.12em] text-engraving">
          {bookId ? "Scoped to one book" : "Whole library"}
        </span>
        {bookId ? (
          <Link
            href="/agora/assistant"
            className="font-utility text-xs uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-engraving-deep"
          >
            Ask across the whole library
          </Link>
        ) : null}
      </div>

      <AssistantPanel scope={scope} variant="full" />
    </div>
  );
}
