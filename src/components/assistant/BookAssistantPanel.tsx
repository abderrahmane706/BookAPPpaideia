"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { AssistantScope } from "@/services/ai/context";
import { AssistantPanel } from "./AssistantPanel";

export interface BookAssistantPanelProps {
  bookId: string;
}

/**
 * BookAssistantPanel — the compact assistant embedded in a book workspace.
 * It drives the same shared conversation as /agora/assistant, scoped to this
 * volume, so questions asked here can be continued in the full workspace.
 */
export function BookAssistantPanel({ bookId }: BookAssistantPanelProps) {
  const scope = useMemo<AssistantScope>(
    () => ({ kind: "book", bookId }),
    [bookId],
  );

  return (
    <div className="grid gap-3">
      <AssistantPanel scope={scope} variant="compact" />
      <p className="text-right font-utility text-xs text-ink-faint">
        <Link
          href={`/agora/assistant?book=${encodeURIComponent(bookId)}`}
          className="underline decoration-line-strong underline-offset-2 transition-colors hover:text-engraving-deep"
        >
          Open in the full assistant →
        </Link>
      </p>
    </div>
  );
}
