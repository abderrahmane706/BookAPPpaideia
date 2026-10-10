"use client";

import { useState } from "react";
import type { Quote } from "@/lib/types/library";
import { QUOTE_HIGHLIGHT_TONES, type QuoteHighlight } from "@/lib/types/library";
import { library } from "@/lib/services/library";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { notify } from "@/components/ui/feedback";

const TONE_BORDER: Record<QuoteHighlight, string> = {
  gold: "border-l-gold",
  blue: "border-l-ink-blue",
  green: "border-l-[#5e7c56]",
  rose: "border-l-[#96605c]",
};

interface Draft {
  text: string;
  page: string;
  highlight: QuoteHighlight;
  annotation: string;
}

const EMPTY: Draft = {
  text: "",
  page: "",
  highlight: "gold",
  annotation: "",
};

export interface QuotesPanelProps {
  bookId: string;
  quotes: Quote[];
}

/** Quotations & highlights the reader has recorded. */
export function QuotesPanel({ bookId, quotes }: QuotesPanelProps) {
  const [mode, setMode] = useState<"idle" | "new" | "edit">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setDraft(EMPTY);
    setEditingId(null);
    setError(null);
    setMode("new");
  }

  function startEdit(quote: Quote) {
    setDraft({
      text: quote.text,
      page: quote.page !== null ? String(quote.page) : "",
      highlight: quote.highlight,
      annotation: quote.annotation ?? "",
    });
    setEditingId(quote.id);
    setError(null);
    setMode("edit");
  }

  function cancel() {
    setMode("idle");
    setEditingId(null);
    setDraft(EMPTY);
    setError(null);
  }

  function save() {
    if (!draft.text.trim()) {
      setError("A quotation needs some text.");
      return;
    }
    const payload = {
      text: draft.text.trim(),
      page: draft.page ? Number(draft.page) : null,
      highlight: draft.highlight,
      annotation: draft.annotation.trim() || null,
    };
    if (mode === "edit" && editingId) {
      library.updateQuote(editingId, payload);
      SoundManager.playSave();
      notify("Quotation updated.");
    } else {
      library.createQuote(bookId, payload);
      SoundManager.playCreate();
      notify("Quotation added.");
    }
    cancel();
  }

  return (
    <div className="grid gap-5">
      {mode === "idle" ? (
        <div>
          <button
            type="button"
            onClick={startNew}
            className="btn-press rounded-radius-sm border border-line-strong bg-surface px-4 py-2 font-utility text-sm text-ink transition-colors hover:border-engraving hover:text-engraving-deep"
          >
            + New quotation
          </button>
        </div>
      ) : (
        <div className="grid gap-3 rounded-radius-md border border-line bg-surface p-4">
          <div className="grid gap-1.5">
            <label
              htmlFor="quote-text"
              className="font-utility text-sm font-medium text-ink"
            >
              Quotation
            </label>
            <textarea
              id="quote-text"
              value={draft.text}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, text: event.target.value }))
              }
              placeholder="Transcribe the passage…"
              className="min-h-24 w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm leading-relaxed text-ink focus:border-engraving focus:outline-none"
            />
            {error ? (
              <p role="alert" className="text-xs text-danger">
                {error}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label
                htmlFor="quote-page"
                className="font-utility text-sm font-medium text-ink"
              >
                Page <span className="text-ink-faint">(optional)</span>
              </label>
              <input
                id="quote-page"
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.page}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, page: event.target.value }))
                }
                className="w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-engraving focus:outline-none"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="quote-tone"
                className="font-utility text-sm font-medium text-ink"
              >
                Highlight tone
              </label>
              <select
                id="quote-tone"
                value={draft.highlight}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    highlight: event.target.value as QuoteHighlight,
                  }))
                }
                className="w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-engraving focus:outline-none"
              >
                {QUOTE_HIGHLIGHT_TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone[0].toUpperCase() + tone.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <label
              htmlFor="quote-annotation"
              className="font-utility text-sm font-medium text-ink"
            >
              Annotation <span className="text-ink-faint">(optional)</span>
            </label>
            <textarea
              id="quote-annotation"
              value={draft.annotation}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, annotation: event.target.value }))
              }
              placeholder="Why it matters…"
              className="min-h-16 w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm leading-relaxed text-ink focus:border-engraving focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              className="rounded-radius-sm px-3 py-1.5 font-utility text-sm text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="btn-press rounded-radius-sm bg-engraving px-4 py-1.5 font-utility text-sm font-medium text-surface hover:bg-engraving-deep"
            >
              {mode === "edit" ? "Save changes" : "Add quotation"}
            </button>
          </div>
        </div>
      )}

      {quotes.length === 0 ? (
        <p className="rounded-radius-md border border-dashed border-line-strong bg-parchment-shade/25 p-6 text-center text-sm text-ink-soft">
          No quotations yet. Preserve a line worth returning to.
        </p>
      ) : (
        <ul className="grid gap-3">
          {quotes.map((quote) => (
            <li
              key={quote.id}
              className={`rounded-radius-md border border-line border-l-4 bg-surface p-4 ${TONE_BORDER[quote.highlight]}`}
            >
              <blockquote className="font-display text-base italic leading-relaxed text-ink">
                “{quote.text}”
              </blockquote>
              {quote.annotation ? (
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {quote.annotation}
                </p>
              ) : null}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/70 pt-2.5">
                <span className="font-utility text-[11px] text-ink-faint">
                  {quote.page !== null ? `p. ${quote.page}` : "No page noted"}
                </span>
                <span className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(quote)}
                    className="font-utility text-xs text-ink-soft underline decoration-line-strong underline-offset-2 hover:text-ink"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      library.deleteQuote(quote.id);
                      SoundManager.playDelete();
                      notify("Quotation deleted.");
                    }}
                    className="font-utility text-xs text-danger underline decoration-line-strong underline-offset-2"
                  >
                    Delete
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
